<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FloorSection;
use App\Models\DiningTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FloorSectionController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->user()->store_id;

        $sections = FloorSection::where('store_id', $storeId)
            ->with('tables')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $sections]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $storeId = $request->user()->store_id;

        $section = FloorSection::create([
            'store_id' => $storeId,
            'name' => $data['name'],
        ]);

        return response()->json(['data' => $section], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
        ]);

        $storeId = $request->user()->store_id;

        $section = FloorSection::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $section->update($data);

        return response()->json(['data' => $section]);
    }

    public function destroy(Request $request, int $id)
    {
        $storeId = $request->user()->store_id;

        $section = FloorSection::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        // Delete tables first
        DiningTable::where('section_id', $id)->delete();

        $section->delete();

        return response()->json(['message' => 'Floor section deleted']);
    }
}
