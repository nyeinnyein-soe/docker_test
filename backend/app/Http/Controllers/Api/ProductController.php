<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->user()->store_id;

        // For management pages, show all products (including inactive)
        // Frontend can filter if needed
        $products = Product::where('store_id', $storeId)
            ->with(['variants', 'modifierGroups.modifiers', 'taxGroup'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $products]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'tax_group_id' => ['nullable', 'integer'],
            'is_taxable' => ['sometimes', 'boolean'],
            'image_url' => ['nullable', 'string'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.cost' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:50'],
            'variants.*.is_default' => ['sometimes', 'boolean'],
        ]);

        $storeId = $request->user()->store_id;

        $product = DB::transaction(function () use ($data, $storeId) {
            $product = Product::create([
                'uuid' => (string) Str::uuid(),
                'store_id' => $storeId,
                'category_id' => $data['category_id'] ?? null,
                'tax_group_id' => $data['tax_group_id'] ?? null,
                'is_taxable' => $data['is_taxable'] ?? true,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => count($data['variants']) > 1 ? 'VARIABLE' : 'SIMPLE',
                'image_url' => $data['image_url'] ?? null,
                'is_active' => true,
            ]);

            foreach ($data['variants'] as $index => $variantData) {
                ProductVariant::create([
                    'uuid' => (string) Str::uuid(),
                    'product_id' => $product->id,
                    'name' => $variantData['name'],
                    'sku' => $variantData['sku'] ?? strtoupper(Str::slug($data['name'])) . '-' . ($index + 1),
                    'price' => $variantData['price'],
                    'cost' => $variantData['cost'] ?? 0,
                    'is_default' => isset($variantData['is_default']) ? $variantData['is_default'] : ($index === 0),
                    'is_active' => true,
                ]);
            }

            return $product->load('variants');
        });

        return response()->json(['data' => $product], 201);
    }

    public function show(Request $request, int $id)
    {
        $storeId = $request->user()->store_id;

        $product = Product::where('id', $id)
            ->where('store_id', $storeId)
            ->with(['variants', 'modifierGroups.modifiers'])
            ->firstOrFail();

        return response()->json(['data' => $product]);
    }

    public function updateModifiers(Request $request, int $id)
    {
        $data = $request->validate([
            'modifier_group_ids' => ['present', 'array'],
            'modifier_group_ids.*' => ['integer', 'exists:modifier_groups,id'],
        ]);

        $storeId = $request->user()->store_id;

        $product = Product::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        // Sync modifier groups with sort order (empty array will remove all)
        $syncData = [];
        foreach ($data['modifier_group_ids'] as $index => $groupId) {
            $syncData[$groupId] = ['sort_order' => $index];
        }

        $product->modifierGroups()->sync($syncData);

        return response()->json(['data' => $product->fresh(['variants', 'modifierGroups.modifiers'])]);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'tax_group_id' => ['nullable', 'integer'],
            'is_taxable' => ['sometimes', 'boolean'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'variants' => ['sometimes', 'array'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.cost' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:50'],
        ]);

        $storeId = $request->user()->store_id;

        $product = Product::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        $product = DB::transaction(function () use ($product, $data) {
            $product->update([
                'name' => $data['name'] ?? $product->name,
                'description' => $data['description'] ?? $product->description,
                'category_id' => $data['category_id'] ?? $product->category_id,
                'tax_group_id' => $data['tax_group_id'] ?? $product->tax_group_id,
                'is_taxable' => $data['is_taxable'] ?? $product->is_taxable,
                'image_url' => $data['image_url'] ?? $product->image_url,
                'is_active' => $data['is_active'] ?? $product->is_active,
            ]);

            if (isset($data['variants'])) {
                $hasNewDefault = collect($data['variants'])->where('is_default', true)->isNotEmpty();

                foreach ($data['variants'] as $index => $variantData) {
                    if (isset($variantData['id'])) {
                        $updateData = [
                            'name' => $variantData['name'],
                            'price' => $variantData['price'],
                            'cost' => $variantData['cost'] ?? 0,
                            'sku' => $variantData['sku'] ?? null,
                        ];

                        if (isset($variantData['is_default'])) {
                            $updateData['is_default'] = $variantData['is_default'];
                        }

                        ProductVariant::where('id', $variantData['id'])
                            ->where('product_id', $product->id)
                            ->update($updateData);

                        // If we just set this one to default, unset others (handled below the loop for efficiency)
                    } else {
                        ProductVariant::create([
                            'uuid' => (string) Str::uuid(),
                            'product_id' => $product->id,
                            'name' => $variantData['name'],
                            'sku' => $variantData['sku'] ?? strtoupper(Str::slug($product->name)) . '-' . ($index + 1),
                            'price' => $variantData['price'],
                            'cost' => $variantData['cost'] ?? 0,
                            'is_default' => $variantData['is_default'] ?? false,
                            'is_active' => true,
                        ]);
                    }
                }

                if ($hasNewDefault) {
                    $newDefaultId = collect($data['variants'])->where('is_default', true)->first()['id'] ?? null;
                    if ($newDefaultId) {
                        ProductVariant::where('product_id', $product->id)
                            ->where('id', '!=', $newDefaultId)
                            ->update(['is_default' => false]);
                    } else {
                        // If it was a newly created one that is default, we need to find it by UUID or similar
                        // For simplicity, we can just fetch the one that is currently default and unset others
                        $latestDefault = ProductVariant::where('product_id', $product->id)
                            ->where('is_default', true)
                            ->orderBy('updated_at', 'desc')
                            ->first();

                        if ($latestDefault) {
                            ProductVariant::where('product_id', $product->id)
                                ->where('id', '!=', $latestDefault->id)
                                ->update(['is_default' => false]);
                        }
                    }
                }
            }

            return $product->fresh('variants');
        });

        return response()->json(['data' => $product]);
    }

    public function destroy(Request $request, int $id)
    {
        $storeId = $request->user()->store_id;

        $product = Product::where('id', $id)
            ->where('store_id', $storeId)
            ->firstOrFail();

        // Soft delete by deactivating
        $product->update(['is_active' => false]);

        return response()->json(['message' => 'Product deleted']);
    }
}
