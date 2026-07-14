<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AddonRecommendationController extends Controller
{
    public function index()
    {
        $recommendations = \App\Models\AddonRecommendation::with(['recommendedMenu', 'targetMenu'])->get();
        return response()->json([
            'message' => 'Success',
            'data' => $recommendations
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'recommended_menu_id' => 'required|exists:menus,id',
            'is_global' => 'required|boolean',
            'target_menu_id' => 'nullable|required_if:is_global,false|exists:menus,id',
            'reason_id' => 'required|string|max:255',
            'reason_en' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $recommendation = \App\Models\AddonRecommendation::create($validated);
        return response()->json([
            'message' => 'Rekomendasi berhasil ditambahkan',
            'data' => $recommendation
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $recommendation = \App\Models\AddonRecommendation::findOrFail($id);

        $validated = $request->validate([
            'recommended_menu_id' => 'sometimes|exists:menus,id',
            'is_global' => 'sometimes|boolean',
            'target_menu_id' => 'nullable|required_if:is_global,false|exists:menus,id',
            'reason_id' => 'sometimes|string|max:255',
            'reason_en' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $recommendation->update($validated);
        return response()->json([
            'message' => 'Rekomendasi berhasil diperbarui',
            'data' => $recommendation
        ]);
    }

    public function destroy($id)
    {
        $recommendation = \App\Models\AddonRecommendation::findOrFail($id);
        $recommendation->delete();
        return response()->json([
            'message' => 'Rekomendasi berhasil dihapus',
            'data' => null
        ], 200);
    }
}
