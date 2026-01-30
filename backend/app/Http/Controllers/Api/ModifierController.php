<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use Illuminate\Http\Request;

class ModifierController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'group_id' => ['required', 'integer', 'exists:modifier_groups,id'],
            'name' => ['required', 'string', 'max:100'],
            'price_extra' => ['nullable', 'numeric', 'min:0'],
            'cost_extra' => ['nullable', 'numeric', 'min:0'],
        ]);

        $group = ModifierGroup::findOrFail($data['group_id']);
        
        // Verify group belongs to user's store
        if ($group->store_id !== $request->user()->store_id) {
            return response()->json(['message' => 'Modifier group not found'], 404);
        }

        $modifier = Modifier::create([
            'group_id' => $data['group_id'],
            'name' => $data['name'],
            'price_extra' => $data['price_extra'] ?? 0,
            'cost_extra' => $data['cost_extra'] ?? 0,
        ]);

        return response()->json(['data' => $modifier], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'price_extra' => ['nullable', 'numeric', 'min:0'],
            'cost_extra' => ['nullable', 'numeric', 'min:0'],
        ]);

        $modifier = Modifier::with('group')->findOrFail($id);
        
        // Verify modifier belongs to user's store
        if ($modifier->group->store_id !== $request->user()->store_id) {
            return response()->json(['message' => 'Modifier not found'], 404);
        }

        $modifier->update($data);

        return response()->json(['data' => $modifier]);
    }

    public function destroy(Request $request, int $id)
    {
        $modifier = Modifier::with('group')->findOrFail($id);
        
        // Verify modifier belongs to user's store
        if ($modifier->group->store_id !== $request->user()->store_id) {
            return response()->json(['message' => 'Modifier not found'], 404);
        }

        $modifier->delete();

        return response()->json(['message' => 'Modifier deleted']);
    }
}
