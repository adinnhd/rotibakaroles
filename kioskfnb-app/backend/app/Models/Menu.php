<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Menu extends Model
{
    protected $fillable = [
        'menu_category_id',
        'name',
        'name_en',
        'slug',
        'description',
        'description_en',
        'price',
        'image_url',
        'is_available',
        'is_recommended',
        'serving_min_people',
        'serving_max_people',
        'sub_category',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'is_recommended' => 'boolean',
        'serving_min_people' => 'integer',
        'serving_max_people' => 'integer',
        'price' => 'integer',
    ];

    public function menuCategory(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'menu_category_id');
    }

    public function category(): BelongsTo
    {
        return $this->menuCategory();
    }
}
