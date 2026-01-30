<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\TaxGroup;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    /**
     * Get menu data updated after a specific time.
     */
    public function menu(Request $request)
    {
        $storeId = $request->user()->store_id;
        $updatedAfter = $request->query('updated_after');

        $query = fn ($q) => $updatedAfter
            ? $q->where('updated_at', '>', $updatedAfter)
            : $q;

        $categories = Category::where('store_id', $storeId)
            ->when($updatedAfter, fn ($q) => $q->where('updated_at', '>', $updatedAfter))
            ->get();

        $products = Product::where('store_id', $storeId)
            ->with(['modifierGroups', 'taxGroup', 'variants'])
            ->when($updatedAfter, fn ($q) => $q->where('updated_at', '>', $updatedAfter))
            ->get();

        // Get variants for products that were updated, or all if no filter
        $productIds = $updatedAfter
            ? Product::where('store_id', $storeId)->pluck('id')
            : $products->pluck('id');

        $variants = ProductVariant::whereIn('product_id', $productIds)
            ->when($updatedAfter, fn ($q) => $q->where('updated_at', '>', $updatedAfter))
            ->get();

        $modifierGroups = ModifierGroup::where('store_id', $storeId)
            ->when($updatedAfter, fn ($q) => $q->where('updated_at', '>', $updatedAfter))
            ->get();

        $groupIds = $updatedAfter
            ? ModifierGroup::where('store_id', $storeId)->pluck('id')
            : $modifierGroups->pluck('id');

        $modifiers = Modifier::whereIn('group_id', $groupIds)
            ->when($updatedAfter, fn ($q) => $q->where('updated_at', '>', $updatedAfter))
            ->get();

        $taxGroups = TaxGroup::where('store_id', $storeId)
            ->with('taxes')
            ->get();

        return response()->json([
            'categories' => $categories,
            'products' => $products,
            'variants' => $variants,
            'modifier_groups' => $modifierGroups,
            'modifiers' => $modifiers,
            'tax_groups' => $taxGroups,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get customers updated after a specific time.
     */
    public function customers(Request $request)
    {
        $storeId = $request->user()->store_id;
        $updatedAfter = $request->query('updated_after');

        $customers = Customer::where('store_id', $storeId)
            ->when($updatedAfter, fn ($q) => $q->where('updated_at', '>', $updatedAfter))
            ->get();

        return response()->json([
            'customers' => $customers,
            'synced_at' => now()->toIso8601String(),
        ]);
    }
}
