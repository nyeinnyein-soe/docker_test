<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->user()->store_id;

        $categories = Category::where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'printer_destination' => ['nullable', 'in:KITCHEN,BAR,NONE'],
        ]);

        $storeId = $request->user()->store_id;

        $category = Category::create([
            'store_id' => $storeId,
            'name' => $data['name'],
            'color_hex' => $data['color_hex'] ?? '#CCCCCC',
            'parent_id' => $data['parent_id'] ?? null,
            'printer_destination' => $data['printer_destination'] ?? 'KITCHEN',
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'color_hex' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'printer_destination' => ['nullable', 'in:KITCHEN,BAR,NONE'],
        ]);

        $storeId = $request->user()->store_id;

        $category = Category::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $category->update($data);

        return response()->json(['data' => $category]);
    }

    public function destroy(Request $request, int $id)
    {
        $storeId = $request->user()->store_id;

        $category = Category::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        // Soft delete
        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
