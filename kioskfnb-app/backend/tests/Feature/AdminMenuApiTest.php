<?php

use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

test('admin can create and update menu category', function () {
    $this->actingAs(User::factory()->admin()->create());

    $createResponse = $this->postJson('/api/admin/categories', [
        'name' => 'Coffee',
        'slug' => 'coffee',
        'icon' => '☕',
        'sort_order' => 10,
        'is_active' => true,
    ]);

    $createResponse
        ->assertCreated()
        ->assertJsonPath('data.name', 'Coffee')
        ->assertJsonPath('data.slug', 'coffee')
        ->assertJsonPath('data.icon', '☕');

    $categoryId = $createResponse->json('data.id');

    $this->putJson("/api/admin/categories/{$categoryId}", [
        'name' => 'Hot Coffee',
        'slug' => 'hot-coffee',
        'icon' => '☕',
        'sort_order' => 11,
        'is_active' => false,
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Hot Coffee')
        ->assertJsonPath('data.is_active', false);
});

test('admin cannot delete category that still has menus', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = MenuCategory::create([
        'name' => 'Burger',
        'slug' => 'burger',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    Menu::create([
        'menu_category_id' => $category->id,
        'name' => 'Classic Burger',
        'slug' => 'classic-burger',
        'price' => 35000,
        'is_available' => true,
        'is_recommended' => false,
        'serving_min_people' => 1,
        'serving_max_people' => 1,
    ]);

    $this->deleteJson("/api/admin/categories/{$category->id}")
        ->assertStatus(422)
        ->assertJsonPath('data', null);
});

test('admin can create update and delete menu', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = MenuCategory::create([
        'name' => 'Minuman',
        'slug' => 'minuman',
        'icon' => '🥤',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $createResponse = $this->postJson('/api/admin/menus', [
        'menu_category_id' => $category->id,
        'name' => 'Es Kopi',
        'slug' => 'es-kopi',
        'description' => 'Kopi susu dingin',
        'price' => 18000,
        'image_url' => '/images/es-kopi.jpg',
        'is_available' => true,
        'is_recommended' => false,
        'serving_min_people' => 1,
        'serving_max_people' => 1,
    ]);

    $createResponse
        ->assertCreated()
        ->assertJsonPath('data.name', 'Es Kopi')
        ->assertJsonPath('data.price', 18000)
        ->assertJsonPath('data.category.slug', 'minuman');

    $menuId = $createResponse->json('data.id');

    $this->putJson("/api/admin/menus/{$menuId}", [
        'menu_category_id' => $category->id,
        'name' => 'Es Kopi Susu',
        'slug' => 'es-kopi-susu',
        'description' => 'Kopi susu dingin',
        'price' => 20000,
        'image_url' => '/images/es-kopi.jpg',
        'is_available' => false,
        'is_recommended' => true,
        'serving_min_people' => 1,
        'serving_max_people' => 2,
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Es Kopi Susu')
        ->assertJsonPath('data.is_available', false);

    $this->deleteJson("/api/admin/menus/{$menuId}")
        ->assertOk()
        ->assertJsonPath('data', null);

    $this->assertDatabaseMissing('menus', [
        'id' => $menuId,
    ]);
});

test('admin can upload menu image', function () {
    $this->actingAs(User::factory()->admin()->create());

    $category = MenuCategory::create([
        'name' => 'Paket',
        'slug' => 'paket',
        'icon' => '🎁',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $response = $this->post('/api/admin/menus', [
        'menu_category_id' => $category->id,
        'name' => 'Paket Upload',
        'slug' => 'paket-upload',
        'description' => 'Menu dengan gambar upload',
        'price' => 25000,
        'is_available' => true,
        'is_recommended' => false,
        'serving_min_people' => 1,
        'serving_max_people' => 1,
        'image' => UploadedFile::fake()->image('paket-upload.jpg'),
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Paket Upload');

    expect($response->json('data.image_url'))->toContain('/uploads/menu-images/');
});

test('guest cannot access admin menus', function () {
    $this->getJson('/api/admin/menus')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthenticated.')
        ->assertJsonPath('data', null);
});

test('non admin user receives forbidden response', function () {
    $this->actingAs(User::factory()->create());

    $this->getJson('/api/admin/menus')
        ->assertForbidden()
        ->assertJsonPath('message', 'Admin access is required')
        ->assertJsonPath('data', null);
});

test('admin can login and access admin menus', function () {
    User::factory()->admin()->create([
        'email' => 'admin@example.com',
        'password' => 'password',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'password',
    ])
        ->assertOk()
        ->assertJsonPath('message', 'Logged in successfully')
        ->assertJsonPath('data.user.role', User::ROLE_ADMIN);

    $this->getJson('/api/admin/menus')
        ->assertOk()
        ->assertJsonPath('message', 'Admin menus retrieved successfully');
});

test('admin can logout', function () {
    User::factory()->admin()->create([
        'email' => 'admin@example.com',
        'password' => 'password',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'password',
    ])->assertOk();

    $this->postJson('/api/auth/logout')
        ->assertOk()
        ->assertJsonPath('message', 'Logged out successfully')
        ->assertJsonPath('data', null);

    $this->getJson('/api/admin/menus')
        ->assertUnauthorized();
});
