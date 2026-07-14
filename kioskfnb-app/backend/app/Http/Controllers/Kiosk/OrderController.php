<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_id' => ['required', 'integer', 'distinct', 'exists:menus,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.options' => ['sometimes', 'array'],
            'items.*.options.*.groupId' => ['required_with:items.*.options', 'string', 'max:50'],
            'items.*.options.*.groupLabel' => ['required_with:items.*.options', 'string', 'max:100'],
            'items.*.options.*.optionId' => ['required_with:items.*.options', 'string', 'max:50'],
            'items.*.options.*.optionLabel' => ['required_with:items.*.options', 'string', 'max:100'],
            'items.*.options.*.priceDelta' => ['required_with:items.*.options', 'integer', 'min:0', 'max:1000000'],
            'order_type' => ['required', 'string', Rule::in(['dine_in', 'take_away'])],
            'delivery_method' => ['nullable', 'string', Rule::in(['pickup', 'delivered']), 'required_if:order_type,dine_in'],
            'table_number' => ['nullable', 'string', 'max:20', 'required_if:delivery_method,delivered'],
            'payment_method' => [
                'required',
                'string',
                Rule::in([
                    Order::PAYMENT_METHOD_QRIS,
                    Order::PAYMENT_METHOD_CREDIT_CARD,
                    Order::PAYMENT_METHOD_VIRTUAL_ACCOUNT,
                ]),
            ],
            'customer_email' => ['nullable', 'email', 'max:255', 'required_if:send_email_receipt,true'],
            'send_email_receipt' => ['sometimes', 'boolean'],
            'print_receipt' => ['sometimes', 'boolean'],
        ]);

        $order = DB::transaction(function () use ($validated) {
            $menuIds = collect($validated['items'])->pluck('menu_id')->all();

            $menus = Menu::query()
                ->with('category')
                ->whereIn('id', $menuIds)
                ->where('is_available', true)
                ->whereHas('category', fn ($query) => $query->where('is_active', true))
                ->get()
                ->keyBy('id');

            if ($menus->count() !== count($menuIds)) {
                throw new HttpResponseException(response()->json([
                    'message' => 'One or more menu items are not available',
                    'data' => null,
                ], 422));
            }

            $subtotal = collect($validated['items'])->sum(function (array $item) use ($menus) {
                /** @var Menu $menu */
                $menu = $menus->get($item['menu_id']);
                $unitPrice = $this->calculateUnitPrice($menu, $item['options'] ?? []);

                return $unitPrice * $item['quantity'];
            });
            $tax = (int) round($subtotal * 0.11);
            $total = $subtotal + $tax;

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'order_type' => $validated['order_type'],
                'delivery_method' => $validated['delivery_method'] ?? null,
                'table_number' => $validated['table_number'] ?? null,
                'status' => Order::STATUS_PAID,
                'payment_status' => Order::PAYMENT_STATUS_PAID,
                'payment_method' => $validated['payment_method'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'customer_email' => $validated['customer_email'] ?? null,
                'send_email_receipt' => $validated['send_email_receipt'] ?? false,
                'print_receipt' => $validated['print_receipt'] ?? false,
            ]);

            foreach ($validated['items'] as $item) {
                /** @var Menu $menu */
                $menu = $menus->get($item['menu_id']);
                $unitPrice = $this->calculateUnitPrice($menu, $item['options'] ?? []);
                $normalizedOptions = $this->normalizeOptions($menu, $item['options'] ?? []);

                $order->items()->create([
                    'menu_id' => $menu->id,
                    'menu_name' => $menu->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $item['quantity'],
                    'line_total' => $unitPrice * $item['quantity'],
                    'options' => $normalizedOptions,
                ]);
            }

            return $order->load('items');
        });

        if ($order->send_email_receipt && !empty($order->customer_email)) {
            \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(new \App\Mail\OrderReceiptMail($order));
        }

        return response()->json([
            'message' => 'Order created successfully',
            'data' => $this->formatOrder($order),
        ], 201);
    }

    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->with('items')
            ->where('order_number', $orderNumber)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'Order retrieved successfully',
            'data' => $this->formatOrder($order),
        ]);
    }

    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Order::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_type' => $order->order_type,
            'delivery_method' => $order->delivery_method,
            'table_number' => $order->table_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
            'customer_email' => $order->customer_email,
            'send_email_receipt' => $order->send_email_receipt,
            'print_receipt' => $order->print_receipt,
            'created_at' => $order->created_at?->toISOString(),
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'menu_id' => $item->menu_id,
                'menu_name' => $item->menu_name,
                'unit_price' => $item->unit_price,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
                'options' => $item->options,
            ])->values(),
        ];
    }

    private function calculateUnitPrice(Menu $menu, array $selectedOptions): int
    {
        return $menu->price + collect($this->normalizeOptions($menu, $selectedOptions))
            ->sum(fn (array $option) => (int) $option['priceDelta']);
    }

    private function normalizeOptions(Menu $menu, array $selectedOptions): array
    {
        if ($selectedOptions === []) {
            return [];
        }

        $allowedGroups = $this->allowedOptionGroups($menu);
        $normalized = [];

        foreach ($selectedOptions as $selectedOption) {
            $groupId = $selectedOption['groupId'] ?? null;
            $optionId = $selectedOption['optionId'] ?? null;

            if (! $groupId || ! $optionId || ! isset($allowedGroups[$groupId])) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Invalid menu options selected',
                    'data' => null,
                ], 422));
            }

            $group = $allowedGroups[$groupId];
            $choice = collect($group['choices'])->firstWhere('id', $optionId);

            if (! $choice) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Invalid menu options selected',
                    'data' => null,
                ], 422));
            }

            $normalized[] = [
                'groupId' => $groupId,
                'groupLabel' => $group['label'],
                'optionId' => $choice['id'],
                'optionLabel' => $choice['label'],
                'priceDelta' => (int) ($choice['priceDelta'] ?? 0),
            ];
        }

        return $normalized;
    }

    private function allowedOptionGroups(Menu $menu): array
    {
        $options = $menu->category?->options ?? [];
        $keyed = [];
        
        foreach ($options as $group) {
            if (isset($group['id'])) {
                $keyed[$group['id']] = $group;
            }
        }
        
        return $keyed;
    }
}
