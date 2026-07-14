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
        $snack = DB::table('menu_categories')->where('slug', 'snack')->first();

        if (! $snack) {
            return;
        }

        $sides = DB::table('menu_categories')->where('slug', 'sides')->first();

        if ($sides) {
            DB::table('menus')
                ->where('menu_category_id', $snack->id)
                ->update(['menu_category_id' => $sides->id]);

            DB::table('menu_categories')
                ->where('id', $snack->id)
                ->delete();

            return;
        }

        DB::table('menu_categories')
            ->where('id', $snack->id)
            ->update([
                'name' => 'Sides',
                'slug' => 'sides',
                'icon' => '🍟',
                'sort_order' => 4,
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
