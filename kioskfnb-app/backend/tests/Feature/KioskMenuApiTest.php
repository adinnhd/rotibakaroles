<?php

use App\Models\Menu;
use App\Models\MenuCategory;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('health endpoint returns ok status', function () {
    $this->getJson('/api/health')
        ->assertOk()
        ->assertJsonPath('message', 'Kiosk FNB API is running')
        ->assertJsonPath('data.status', 'ok');
});

test('categories use frontend friendly contract', function () {
    $this->seed(MenuSeeder::class);

    $this->getJson('/api/kiosk/categories')
        ->assertOk()
        ->assertJsonPath('data.0.id', 'paket')
        ->assertJsonPath('data.0.name', 'Paket')
        ->assertJsonStructure([
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'icon',
                    'slug',
                    'database_id',
                    'sort_order',
                ],
            ],
        ]);
});

test('menus use frontend friendly contract', function () {
    $this->seed(MenuSeeder::class);

    $this->getJson('/api/kiosk/menus')
        ->assertOk()
        ->assertJsonPath('data.0.price', fn ($price) => is_int($price))
        ->assertJsonStructure([
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'slug',
                    'description',
                    'price',
                    'image',
                    'image_url',
                    'category',
                    'category_id',
                    'category_detail' => [
                        'id',
                        'name',
                        'slug',
                        'icon',
                    ],
                    'is_available',
                    'is_recommended',
                    'serving_min_people',
                    'serving_max_people',
                ],
            ],
        ]);
});

test('menus can be filtered by category slug', function () {
    $this->seed(MenuSeeder::class);

    $response = $this->getJson('/api/kiosk/menus?category=burger')
        ->assertOk();

    expect($response->json('data'))->not->toBeEmpty();

    foreach ($response->json('data') as $menu) {
        expect($menu['category'])->toBe('burger');
    }
});

test('menus can be searched', function () {
    $this->seed(MenuSeeder::class);

    $response = $this->getJson('/api/kiosk/menus?search=cola')
        ->assertOk();

    expect(collect($response->json('data'))->pluck('name')->all())->toContain('Cola');
});

test('unavailable menus and inactive categories are hidden', function () {
    $this->seed(MenuSeeder::class);

    $burger = Menu::where('slug', 'classic-burger')->firstOrFail();
    $burger->update(['is_available' => false]);

    $inactiveCategory = MenuCategory::where('slug', 'dessert')->firstOrFail();
    $inactiveCategory->update(['is_active' => false]);

    $response = $this->getJson('/api/kiosk/menus')
        ->assertOk();

    $slugs = collect($response->json('data'))->pluck('slug');

    expect($slugs)->not->toContain('classic-burger');
    expect($response->json('data.*.category'))->not->toContain('dessert');
});
