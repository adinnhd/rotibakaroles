<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with('items')
            ->latest()
            ->get()
            ->map(fn (Order $order) => $this->formatOrder($order));

        return response()->json([
            'message' => 'Admin orders retrieved successfully',
            'data' => $orders,
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'])->startOfDay()
            : now()->startOfDay();
        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'])->endOfDay()
            : now()->endOfDay();

        $paidOrdersQuery = $this->paidOrdersQuery()
            ->whereBetween('created_at', [$from, $to]);

        $orderCount = (clone $paidOrdersQuery)->count();
        $totalRevenue = (int) (clone $paidOrdersQuery)->sum('total');
        $itemCount = (int) OrderItem::query()
            ->whereHas('order', function (Builder $query) use ($from, $to) {
                $this->applyPaidOrderScope($query)
                    ->whereBetween('created_at', [$from, $to]);
            })
            ->sum('quantity');

        $topProducts = OrderItem::query()
            ->selectRaw('menu_id, menu_name, SUM(quantity) as quantity_sold, SUM(line_total) as total_revenue')
            ->whereHas('order', function (Builder $query) use ($from, $to) {
                $this->applyPaidOrderScope($query)
                    ->whereBetween('created_at', [$from, $to]);
            })
            ->groupBy('menu_id', 'menu_name')
            ->orderByDesc('quantity_sold')
            ->limit(5)
            ->get()
            ->map(fn (OrderItem $item) => [
                'menu_id' => $item->menu_id,
                'menu_name' => $item->menu_name,
                'quantity_sold' => (int) $item->quantity_sold,
                'total_revenue' => (int) $item->total_revenue,
            ])
            ->values();

        $paymentMethods = (clone $paidOrdersQuery)
            ->selectRaw('payment_method, COUNT(*) as order_count, SUM(total) as total_revenue')
            ->groupBy('payment_method')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(fn (Order $order) => [
                'payment_method' => $order->payment_method,
                'order_count' => (int) $order->order_count,
                'total_revenue' => (int) $order->total_revenue,
            ])
            ->values();

        $recentOrders = (clone $paidOrdersQuery)
            ->with('items')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Order $order) => $this->formatOrder($order))
            ->values();

        return response()->json([
            'message' => 'Admin sales summary retrieved successfully',
            'data' => [
                'period' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
                'total_revenue' => $totalRevenue,
                'order_count' => $orderCount,
                'item_count' => $itemCount,
                'average_order_value' => $orderCount > 0 ? (int) round($totalRevenue / $orderCount) : 0,
                'top_products' => $topProducts,
                'payment_methods' => $paymentMethods,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load('items');

        return response()->json([
            'message' => 'Admin order retrieved successfully',
            'data' => $this->formatOrder($order),
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in([
                    Order::STATUS_PAID,
                    Order::STATUS_PREPARING,
                    Order::STATUS_READY,
                    Order::STATUS_COMPLETED,
                    Order::STATUS_CANCELLED,
                ]),
            ],
        ]);

        $order->update(['status' => $validated['status']]);
        $order->load('items');

        return response()->json([
            'message' => 'Order status updated successfully',
            'data' => $this->formatOrder($order),
        ]);
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
            ])->values(),
        ];
    }

    private function paidOrdersQuery(): Builder
    {
        return $this->applyPaidOrderScope(Order::query());
    }

    private function applyPaidOrderScope(Builder $query): Builder
    {
        return $query
            ->where('payment_status', Order::PAYMENT_STATUS_PAID)
            ->where('status', '!=', Order::STATUS_CANCELLED);
    }
}
