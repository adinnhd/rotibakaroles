<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;

class MenuCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = MenuCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (MenuCategory $category) {
                return [
                    'id' => $category->slug,
                    'name' => $category->name,
                    'icon' => $category->icon,
                    'slug' => $category->slug,
                    'database_id' => $category->id,
                    'sort_order' => $category->sort_order,
                    'options' => $category->options,
                ];
            });

        return response()->json([
            'message' => 'Menu categories retrieved successfully',
            'data' => $categories,
        ]);
    }
}
