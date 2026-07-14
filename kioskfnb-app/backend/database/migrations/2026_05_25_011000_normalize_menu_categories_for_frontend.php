<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->mergeCategory('paket-hemat', [
            'name' => 'Paket',
            'slug' => 'paket',
            'icon' => '🎁',
            'sort_order' => 1,
        ]);

        $this->mergeCategory('snack', [
            'name' => 'Sides',
            'slug' => 'sides',
            'icon' => '🍟',
            'sort_order' => 4,
        ]);

        $canonicalCategories = [
            'paket' => ['name' => 'Paket', 'icon' => '🎁', 'sort_order' => 1],
            'burger' => ['name' => 'Burger', 'icon' => '🍔', 'sort_order' => 2],
            'ayam' => ['name' => 'Ayam', 'icon' => '🍗', 'sort_order' => 3],
            'sides' => ['name' => 'Sides', 'icon' => '🍟', 'sort_order' => 4],
            'minuman' => ['name' => 'Minuman', 'icon' => '🥤', 'sort_order' => 5],
            'dessert' => ['name' => 'Dessert', 'icon' => '🍦', 'sort_order' => 6],
        ];

        foreach ($canonicalCategories as $slug => $category) {
            DB::table('menu_categories')
                ->where('slug', $slug)
                ->update([
                    'name' => $category['name'],
                    'icon' => $category['icon'],
                    'sort_order' => $category['sort_order'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }

    private function mergeCategory(string $oldSlug, array $replacement): void
    {
        $oldCategory = DB::table('menu_categories')->where('slug', $oldSlug)->first();

        if (! $oldCategory) {
            return;
        }

        $newCategory = DB::table('menu_categories')->where('slug', $replacement['slug'])->first();

        if ($newCategory) {
            DB::table('menus')
                ->where('menu_category_id', $oldCategory->id)
                ->update(['menu_category_id' => $newCategory->id]);

            DB::table('menu_categories')
                ->where('id', $oldCategory->id)
                ->delete();

            return;
        }

        DB::table('menu_categories')
            ->where('id', $oldCategory->id)
            ->update([
                ...$replacement,
                'updated_at' => now(),
            ]);
    }
};
