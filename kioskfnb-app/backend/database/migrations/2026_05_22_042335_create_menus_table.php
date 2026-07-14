<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_category_id')
                ->constrained('menu_categories')
                ->cascadeOnDelete();
            
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('price');
            $table->string('image_url')->nullable();

            $table->boolean('is_available')->default(true); 
            $table->boolean('is_recommended')->default(false);

            $table->unsignedInteger('serving_min_people')->default(1);
            $table->unsignedInteger('serving_max_people')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
