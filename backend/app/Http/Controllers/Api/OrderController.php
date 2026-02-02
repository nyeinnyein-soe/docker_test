<?php

namespace App\Http\Controllers\Api;

use App\Actions\Orders\ConfirmOrder;
use App\Actions\Orders\CreateOrder;
use App\Actions\Orders\PayOrder;
use App\Actions\Orders\UpdateOrderTax;
use App\Actions\Orders\VoidOrder;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->user()->store_id;

        $orders = Order::where('store_id', $storeId)
            ->with(['items.variant', 'items.modifiers.modifier', 'payments', 'taxLines'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function show(Request $request, string $uuid)
    {
        $storeId = $request->user()->store_id;

        $order = Order::where('uuid', $uuid)
            ->where('store_id', $storeId)
            ->with(['items.variant', 'items.modifiers.modifier', 'payments', 'taxLines', 'discounts'])
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function store(Request $request, CreateOrder $createOrder)
    {
        $data = $request->validate([
            'shift_id' => ['required', 'integer'],
            'table_session_id' => ['nullable', 'integer'],
            'customer_id' => ['nullable', 'integer'],
            'type' => ['required', 'in:DINE_IN,TAKEOUT,TAKE_OUT,DELIVERY'],
            'tax_type' => ['nullable', 'in:NONE,COMMERCIAL,SERVICE,BOTH'],
            'order_number' => ['nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.modifiers' => ['nullable', 'array'],
            'items.*.modifiers.*' => ['integer', 'exists:modifiers,id'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            // Tax & Discount
            'tax_group_id' => ['nullable', 'integer'],
            'discount_id' => ['nullable', 'integer'],
            'manual_discount' => ['nullable', 'array'],
            'manual_discount.name' => ['required_with:manual_discount', 'string', 'max:100'],
            'manual_discount.type' => ['required_with:manual_discount', 'in:PERCENTAGE,FIXED_AMOUNT'],
            'manual_discount.value' => ['required_with:manual_discount', 'numeric', 'min:0'],
        ]);

        // Normalize type (frontend uses TAKEOUT, database uses TAKE_OUT)
        if ($data['type'] === 'TAKEOUT') {
            $data['type'] = 'TAKE_OUT';
        }

        // Simple fallback order number if not provided
        $data['order_number'] = $data['order_number'] ?? (string) Str::random(8);
        $data['employee'] = $request->user();

        $order = $createOrder($data);

        return response()->json(['data' => $order], 201);
    }

    public function pay(string $uuid, Request $request, PayOrder $payOrder)
    {
        $data = $request->validate([
            'shift_id' => ['required', 'integer'],
            'terminal_uuid' => ['nullable', 'string'],
            'method' => ['required', 'in:CASH,CARD,MOBILE,QR,LOYALTY,OTHER'],
            'amount' => ['required', 'numeric', 'min:0'],
            'tip_amount' => ['nullable', 'numeric', 'min:0'],
            'external_ref' => ['nullable', 'string', 'max:100'],
        ]);

        $data['order_uuid'] = $uuid;
        $data['employee'] = $request->user();

        $order = $payOrder($data);

        return response()->json(['data' => $order]);
    }

    public function confirm(string $uuid, ConfirmOrder $confirmOrder)
    {
        $order = $confirmOrder($uuid);

        return response()->json(['data' => $order]);
    }

    public function void(string $uuid, Request $request, VoidOrder $voidOrder)
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $data['employee'] = $request->user();

        $order = $voidOrder($uuid, $data);

        return response()->json(['data' => $order]);
    }

    public function updateTax(string $uuid, Request $request, UpdateOrderTax $updateOrderTax)
    {
        $data = $request->validate([
            'tax_type' => ['required', 'in:NONE,COMMERCIAL,SERVICE,BOTH'],
        ]);

        $order = $updateOrderTax($uuid, $data['tax_type']);

        return response()->json(['data' => $order]);
    }
}

