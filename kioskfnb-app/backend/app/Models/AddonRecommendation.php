<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AddonRecommendation extends Model
{
    protected $fillable = [
        'recommended_menu_id',
        'is_global',
        'target_menu_id',
        'reason_id',
        'reason_en',
        'is_active',
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function recommendedMenu()
    {
        return $this->belongsTo(Menu::class, 'recommended_menu_id');
    }

    public function targetMenu()
    {
        return $this->belongsTo(Menu::class, 'target_menu_id');
    }
}
