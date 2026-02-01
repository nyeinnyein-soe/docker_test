<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreSettingsController extends Controller
{
    /**
     * Get store tax configuration settings.
     */
    public function show(Request $request)
    {
        $employee = $request->user();
        $store = Store::findOrFail($employee->store_id);

        return response()->json([
            'data' => [
                'commercial_tax_rate' => (float) $store->commercial_tax_rate,
                'commercial_tax_inclusive' => (bool) $store->commercial_tax_inclusive,
                'service_charge_rate' => (float) $store->service_charge_rate,
                'service_charge_inclusive' => (bool) $store->service_charge_inclusive,
                'default_tax_type' => $store->default_tax_type ?? 'NONE',
            ],
        ]);
    }

    /**
     * Update store tax configuration settings.
     */
    public function update(Request $request)
    {
        $employee = $request->user();
        $store = Store::findOrFail($employee->store_id);

        $validated = $request->validate([
            'commercial_tax_rate' => 'sometimes|numeric|min:0|max:1',
            'commercial_tax_inclusive' => 'sometimes|boolean',
            'service_charge_rate' => 'sometimes|numeric|min:0|max:1',
            'service_charge_inclusive' => 'sometimes|boolean',
            'default_tax_type' => 'sometimes|in:NONE,COMMERCIAL,SERVICE,BOTH',
        ]);

        $store->update($validated);

        return response()->json([
            'message' => 'Store settings updated successfully',
            'data' => [
                'commercial_tax_rate' => (float) $store->commercial_tax_rate,
                'commercial_tax_inclusive' => (bool) $store->commercial_tax_inclusive,
                'service_charge_rate' => (float) $store->service_charge_rate,
                'service_charge_inclusive' => (bool) $store->service_charge_inclusive,
                'default_tax_type' => $store->default_tax_type,
            ],
        ]);
    }
}
