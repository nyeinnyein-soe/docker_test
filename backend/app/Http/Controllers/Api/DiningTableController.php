<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use Illuminate\Http\Request;

class DiningTableController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'section_id' => ['required', 'integer', 'exists:floor_sections,id'],
            'name' => ['required', 'string', 'max:20'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'x_pos' => ['nullable', 'integer'],
            'y_pos' => ['nullable', 'integer'],
        ]);

        $table = DiningTable::create([
            'section_id' => $data['section_id'],
            'name' => $data['name'],
            'capacity' => $data['capacity'] ?? 4,
            'x_pos' => $data['x_pos'] ?? 0,
            'y_pos' => $data['y_pos'] ?? 0,
        ]);

        return response()->json(['data' => $table], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:20'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'x_pos' => ['nullable', 'integer'],
            'y_pos' => ['nullable', 'integer'],
        ]);

        $table = DiningTable::findOrFail($id);
        $table->update($data);

        return response()->json(['data' => $table]);
    }

    public function destroy(Request $request, int $id)
    {
        $table = DiningTable::findOrFail($id);
        $table->delete();

        return response()->json(['message' => 'Table deleted']);
    }
}
