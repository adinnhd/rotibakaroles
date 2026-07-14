<?php

use App\Models\Menu;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('kiosk can create a paid order', function () {
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'paket-hemat-a')->firstOrFail();

    $response = $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $menu->id,
                'quantity' => 2,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_QRIS,
        'send_email_receipt' => true,
        'customer_email' => 'customer@example.com',
        'print_receipt' => false,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('message', 'Order created successfully')
        ->assertJsonPath('data.status', Order::STATUS_PAID)
        ->assertJsonPath('data.payment_status', Order::PAYMENT_STATUS_PAID)
        ->assertJsonPath('data.payment_method', Order::PAYMENT_METHOD_QRIS)
        ->assertJsonPath('data.subtotal', 50000)
        ->assertJsonPath('data.tax', 5500)
        ->assertJsonPath('data.total', 55500)
        ->assertJsonPath('data.items.0.menu_name', 'Paket Hemat A')
        ->assertJsonPath('data.items.0.quantity', 2);

    expect($response->json('data.order_number'))->toStartWith('ORD-');

    $this->assertDatabaseHas('orders', [
        'order_number' => $response->json('data.order_number'),
        'total' => 55500,
    ]);
});

test('kiosk can create an order from frontend origin without csrf token', function () {
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'paket-hemat-a')->firstOrFail();

    $this
        ->withHeaders([
            'Origin' => 'http://localhost:3000',
        ])
        ->postJson('/api/kiosk/orders', [
            'items' => [
                [
                    'menu_id' => $menu->id,
                    'quantity' => 1,
                ],
            ],
            'payment_method' => Order::PAYMENT_METHOD_QRIS,
        ])
        ->assertCreated()
        ->assertJsonPath('data.payment_method', Order::PAYMENT_METHOD_QRIS);
});

test('kiosk order totals are calculated from backend menu prices', function () {
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'cola')->firstOrFail();
    $menu->update(['price' => 13000]);

    $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $menu->id,
                'quantity' => 3,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_CREDIT_CARD,
    ])
        ->assertCreated()
        ->assertJsonPath('data.subtotal', 39000)
        ->assertJsonPath('data.tax', 4290)
        ->assertJsonPath('data.total', 43290);
});

test('kiosk applies supported menu options when calculating totals', function () {
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'cola')->firstOrFail();

    $response = $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $menu->id,
                'quantity' => 2,
                'options' => [
                    [
                        'groupId' => 'size',
                        'groupLabel' => 'Ukuran',
                        'optionId' => 'large',
                        'optionLabel' => 'Large',
                        'priceDelta' => 4000,
                    ],
                    [
                        'groupId' => 'ice',
                        'groupLabel' => 'Es',
                        'optionId' => 'less',
                        'optionLabel' => 'Less Ice',
                        'priceDelta' => 0,
                    ],
                ],
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_QRIS,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.subtotal', 32000)
        ->assertJsonPath('data.tax', 3520)
        ->assertJsonPath('data.total', 35520)
        ->assertJsonPath('data.items.0.unit_price', 16000)
        ->assertJsonPath('data.items.0.options.0.optionLabel', 'Large');
});

test('kiosk cannot order unavailable menus', function () {
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'classic-burger')->firstOrFail();
    $menu->update(['is_available' => false]);

    $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $menu->id,
                'quantity' => 1,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_VIRTUAL_ACCOUNT,
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'One or more menu items are not available');
});

test('kiosk can retrieve order by order number', function () {
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'aqua')->firstOrFail();
    $orderNumber = $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $menu->id,
                'quantity' => 1,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_QRIS,
    ])->json('data.order_number');

    $this->getJson("/api/kiosk/orders/{$orderNumber}")
        ->assertOk()
        ->assertJsonPath('data.order_number', $orderNumber)
        ->assertJsonPath('data.items.0.menu_name', 'Aqua');
});

test('admin can update order status', function () {
    $this->actingAs(User::factory()->admin()->create());
    $this->seed(MenuSeeder::class);

    $menu = Menu::where('slug', 'paket-trio')->firstOrFail();
    $orderId = $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $menu->id,
                'quantity' => 1,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_QRIS,
    ])->json('data.id');

    $this->putJson("/api/admin/orders/{$orderId}/status", [
        'status' => Order::STATUS_PREPARING,
    ])
        ->assertOk()
        ->assertJsonPath('data.status', Order::STATUS_PREPARING);
});

test('admin can view kiosk sales summary', function () {
    $this->actingAs(User::factory()->admin()->create());
    $this->seed(MenuSeeder::class);

    $burgerPackage = Menu::where('slug', 'paket-hemat-a')->firstOrFail();
    $cola = Menu::where('slug', 'cola')->firstOrFail();

    $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $burgerPackage->id,
                'quantity' => 2,
            ],
            [
                'menu_id' => $cola->id,
                'quantity' => 1,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_QRIS,
    ])->assertCreated();

    $cancelledOrderId = $this->postJson('/api/kiosk/orders', [
        'items' => [
            [
                'menu_id' => $cola->id,
                'quantity' => 5,
            ],
        ],
        'payment_method' => Order::PAYMENT_METHOD_CREDIT_CARD,
    ])->json('data.id');

    Order::findOrFail($cancelledOrderId)->update([
        'status' => Order::STATUS_CANCELLED,
    ]);

    $this->getJson('/api/admin/orders/summary')
        ->assertOk()
        ->assertJsonPath('message', 'Admin sales summary retrieved successfully')
        ->assertJsonPath('data.order_count', 1)
        ->assertJsonPath('data.item_count', 3)
        ->assertJsonPath('data.total_revenue', 68820)
        ->assertJsonPath('data.top_products.0.menu_name', 'Paket Hemat A')
        ->assertJsonPath('data.top_products.0.quantity_sold', 2)
        ->assertJsonPath('data.payment_methods.0.payment_method', Order::PAYMENT_METHOD_QRIS);
});
