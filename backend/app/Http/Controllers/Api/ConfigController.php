<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function show(Request $request)
    {
        $store = $request->user()->store;

        if (!$store) {
            return response()->json(['data' => [
                'pos_mode' => 'RETAIL',
                'business_name' => '',
                'currency' => 'MMK',
                'setup_complete' => false,
            ]]);
        }

        return response()->json(['data' => [
            'pos_mode' => $store->pos_mode ?? 'RETAIL',
            'business_name' => $store->name,
            'currency' => $store->currency_code,
            'setup_complete' => $store->setup_complete ?? false,
            'time_zone' => $store->time_zone,
        ]]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'pos_mode' => ['nullable', 'string', 'in:RETAIL,CAFE,RESTAURANT'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:10'],
            'setup_complete' => ['nullable', 'boolean'],
        ]);

        $store = $request->user()->store;

        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $store->update([
            'pos_mode' => $data['pos_mode'] ?? $store->pos_mode,
            'name' => $data['business_name'] ?? $store->name,
            'currency_code' => $data['currency'] ?? $store->currency_code,
            'setup_complete' => $data['setup_complete'] ?? $store->setup_complete,
        ]);

        return response()->json(['data' => [
            'pos_mode' => $store->pos_mode,
            'business_name' => $store->name,
            'currency' => $store->currency_code,
            'setup_complete' => $store->setup_complete,
        ]]);
    }
}
