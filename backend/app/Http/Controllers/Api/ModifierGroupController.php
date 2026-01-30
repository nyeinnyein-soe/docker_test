<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModifierGroup;
use Illuminate\Http\Request;

class ModifierGroupController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->user()->store_id;

        $groups = ModifierGroup::where('store_id', $storeId)
            ->with('modifiers')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $groups]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'min_select' => ['nullable', 'integer', 'min:0'],
            'max_select' => ['nullable', 'integer', 'min:1'],
        ]);

        $storeId = $request->user()->store_id;

        $group = ModifierGroup::create([
            'store_id' => $storeId,
            'name' => $data['name'],
            'min_select' => $data['min_select'] ?? 0,
            'max_select' => $data['max_select'] ?? 1,
        ]);

        return response()->json(['data' => $group], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'min_select' => ['nullable', 'integer', 'min:0'],
            'max_select' => ['nullable', 'integer', 'min:1'],
        ]);

        $storeId = $request->user()->store_id;

        $group = ModifierGroup::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $group->update($data);

        return response()->json(['data' => $group]);
    }

    public function destroy(Request $request, int $id)
    {
        $storeId = $request->user()->store_id;

        $group = ModifierGroup::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        // Delete modifiers first
        $group->modifiers()->delete();
        $group->delete();

        return response()->json(['message' => 'Modifier group deleted']);
    }
}
