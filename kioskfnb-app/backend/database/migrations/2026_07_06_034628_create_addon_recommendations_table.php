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
        Schema::create('addon_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recommended_menu_id')->constrained('menus')->cascadeOnDelete();
            $table->boolean('is_global')->default(false);
            $table->foreignId('target_menu_id')->nullable()->constrained('menus')->cascadeOnDelete();
            $table->string('reason_id');
            $table->string('reason_en')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addon_recommendations');
    }
};
