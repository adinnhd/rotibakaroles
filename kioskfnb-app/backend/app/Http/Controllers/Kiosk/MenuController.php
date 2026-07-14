<?php

namespace App\Http\Controllers\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $menus = Menu::query()
            ->with('category')
            ->where('is_available', true)
            ->whereHas('category', function ($query) {
                $query->where('is_active', true);
            })
            ->when($request->filled('category_id'), function ($query) use ($request) {
                $query->where('menu_category_id', $request->integer('category_id'));
            })
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', function ($categoryQuery) use ($request) {
                    $categoryQuery->where('slug', $request->string('category')->toString());
                });
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = strtolower($request->string('search')->toString());

                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(description) LIKE ?', ["%{$search}%"]);
                });
            })
            ->orderBy('name')
            ->get()
            ->map(function (Menu $menu) {
                return $this->formatMenu($menu);
            });

        return response()->json([
            'message' => 'Menus retrieved successfully',
            'data' => $menus,
        ]);
    }

    public function show(Menu $menu): JsonResponse
    {
        $menu->load('category');

        if (! $menu->is_available || ! $menu->category->is_active) {
            return response()->json([
                'message' => 'Menu not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Menu detail retrieved successfully',
            'data' => $this->formatMenu($menu),
        ]);
    }

    private function formatMenu(Menu $menu): array
    {
        return [
            'id' => $menu->id,
            'name' => $menu->name,
            'name_en' => $menu->name_en,
            'slug' => $menu->slug,
            'description' => $menu->description,
            'description_en' => $menu->description_en,
            'price' => $menu->price,
            'image' => $menu->image_url,
            'image_url' => $menu->image_url,
            'category' => $menu->category->slug,
            'category_id' => $menu->category->id,
            'category_detail' => [
                'id' => $menu->category->id,
                'name' => $menu->category->name,
                'slug' => $menu->category->slug,
                'icon' => $menu->category->icon,
            ],
            'is_available' => $menu->is_available,
            'is_recommended' => $menu->is_recommended,
            'serving_min_people' => $menu->serving_min_people,
            'serving_max_people' => $menu->serving_max_people,
            'sub_category' => $menu->sub_category,
        ];
    }
}
