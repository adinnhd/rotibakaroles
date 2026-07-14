<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class MenuCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = MenuCategory::query()
            ->withCount('menus')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (MenuCategory $category) => $this->formatCategory($category));

        return response()->json([
            'message' => 'Admin menu categories retrieved successfully',
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateCategory($request);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $category = MenuCategory::create($validated);

        return response()->json([
            'message' => 'Menu category created successfully',
            'data' => $this->formatCategory($category),
        ], 201);
    }

    public function update(Request $request, MenuCategory $category): JsonResponse
    {
        $validated = $this->validateCategory($request, $category);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $category->update($validated);

        return response()->json([
            'message' => 'Menu category updated successfully',
            'data' => $this->formatCategory($category->fresh()),
        ]);
    }

    public function destroy(MenuCategory $category): JsonResponse
    {
        if ($category->menus()->exists()) {
            return response()->json([
                'message' => 'Menu category cannot be deleted while it still has menus',
                'data' => null,
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Menu category deleted successfully',
            'data' => null,
        ]);
    }

    private function validateCategory(Request $request, ?MenuCategory $category = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => [
                'nullable',
                'string',
                'max:120',
                Rule::unique('menu_categories', 'slug')->ignore($category),
            ],
            'icon' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
            'options' => ['nullable', 'array'],
        ]);
    }

    private function formatCategory(MenuCategory $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'icon' => $category->icon,
            'sort_order' => $category->sort_order,
            'is_active' => $category->is_active,
            'options' => $category->options,
            'menus_count' => $category->menus_count ?? $category->menus()->count(),
        ];
    }
}
