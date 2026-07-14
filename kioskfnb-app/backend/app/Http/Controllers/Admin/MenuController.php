<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class MenuController extends Controller
{
    public function index(): JsonResponse
    {
        $menus = Menu::query()
            ->with('category')
            ->orderBy('name')
            ->get()
            ->map(fn (Menu $menu) => $this->formatMenu($menu));

        return response()->json([
            'message' => 'Admin menus retrieved successfully',
            'data' => $menus,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateMenu($request);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['image_url'] = $this->resolveImageUrl($request, $validated);

        $menu = Menu::create($validated)->load('category');

        return response()->json([
            'message' => 'Menu created successfully',
            'data' => $this->formatMenu($menu),
        ], 201);
    }

    public function update(Request $request, Menu $menu): JsonResponse
    {
        $validated = $this->validateMenu($request, $menu);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $validated['image_url'] = $this->resolveImageUrl($request, $validated);

        $menu->update($validated);
        $menu->load('category');

        return response()->json([
            'message' => 'Menu updated successfully',
            'data' => $this->formatMenu($menu),
        ]);
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $menu->delete();

        return response()->json([
            'message' => 'Menu deleted successfully',
            'data' => null,
        ]);
    }

    private function validateMenu(Request $request, ?Menu $menu = null): array
    {
        return $request->validate([
            'menu_category_id' => ['required', 'integer', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'name_en' => ['nullable', 'string', 'max:150'],
            'slug' => [
                'nullable',
                'string',
                'max:180',
                Rule::unique('menus', 'slug')->ignore($menu),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'integer', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'image', 'max:2048'],
            'is_available' => ['required', 'boolean'],
            'is_recommended' => ['required', 'boolean'],
            'serving_min_people' => ['required', 'integer', 'min:1'],
            'serving_max_people' => ['required', 'integer', 'min:1', 'gte:serving_min_people'],
        ]);
    }

    private function resolveImageUrl(Request $request, array $validated): ?string
    {
        if (! $request->hasFile('image')) {
            return $validated['image_url'] ?? null;
        }

        $image = $request->file('image');
        $directory = public_path('uploads/menu-images');
        $filename = Str::slug($validated['name']).'-'.uniqid().'.'.$image->getClientOriginalExtension();

        $image->move($directory, $filename);

        return $request->getSchemeAndHttpHost().'/uploads/menu-images/'.$filename;
    }

    private function formatMenu(Menu $menu): array
    {
        return [
            'id' => $menu->id,
            'menu_category_id' => $menu->menu_category_id,
            'name' => $menu->name,
            'name_en' => $menu->name_en,
            'slug' => $menu->slug,
            'description' => $menu->description,
            'description_en' => $menu->description_en,
            'price' => $menu->price,
            'image_url' => $menu->image_url,
            'is_available' => $menu->is_available,
            'is_recommended' => $menu->is_recommended,
            'serving_min_people' => $menu->serving_min_people,
            'serving_max_people' => $menu->serving_max_people,
            'category' => [
                'id' => $menu->category->id,
                'name' => $menu->category->name,
                'slug' => $menu->category->slug,
                'icon' => $menu->category->icon,
            ],
        ];
    }
}
