<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductVariantController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'name' => ['required', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:50'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        $product = Product::findOrFail($data['product_id']);
        
        // Verify product belongs to user's store
        if ($product->store_id !== $request->user()->store_id) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $variant = ProductVariant::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $data['product_id'],
            'name' => $data['name'],
            'sku' => $data['sku'] ?? null,
            'price' => $data['price'],
            'cost' => $data['cost'] ?? 0,
        ]);

        return response()->json(['data' => $variant], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:50'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        $variant = ProductVariant::with('product')->findOrFail($id);
        
        // Verify variant belongs to user's store
        if ($variant->product->store_id !== $request->user()->store_id) {
            return response()->json(['message' => 'Variant not found'], 404);
        }

        $variant->update($data);

        return response()->json(['data' => $variant]);
    }

    public function destroy(Request $request, int $id)
    {
        $variant = ProductVariant::with('product')->findOrFail($id);
        
        // Verify variant belongs to user's store
        if ($variant->product->store_id !== $request->user()->store_id) {
            return response()->json(['message' => 'Variant not found'], 404);
        }

        // Soft delete
        $variant->delete();

        return response()->json(['message' => 'Variant deleted']);
    }
}
