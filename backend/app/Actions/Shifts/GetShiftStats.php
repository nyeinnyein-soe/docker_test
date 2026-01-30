<?php

namespace App\Actions\Shifts;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\Payment;
use App\Models\Shift;

class GetShiftStats
{
    public function __invoke(Shift $shift): array
    {
        $orders = Order::where('shift_id', $shift->id)
            ->where('status', '!=', 'VOIDED')
            ->get();

        $ordersCount = $orders->count();
        $totalSales = $orders->sum('grand_total');
        $totalTax = $orders->sum('total_tax');
        $totalDiscount = $orders->sum('total_discount');

        $itemsCount = OrderItem::whereHas('order', function ($query) use ($shift) {
            $query->where('shift_id', $shift->id)
                ->where('status', '!=', 'VOIDED');
        })->sum('quantity');

        $modifiersCount = OrderItemModifier::whereHas('orderItem.order', function ($query) use ($shift) {
            $query->where('shift_id', $shift->id)
                ->where('status', '!=', 'VOIDED');
        })->count();

        // Payments breakdown
        $payments = Payment::where('shift_id', $shift->id)
            ->where('status', 'SUCCESS')
            ->get();

        $cashPayments = $payments->where('method', 'CASH')->sum('amount');
        $cardPayments = $payments->where('method', 'CARD')->sum('amount');
        $otherPayments = $payments->whereNotIn('method', ['CASH', 'CARD'])->sum('amount');

        return [
            'orders_count' => $ordersCount,
            'items_count' => (int) $itemsCount,
            'modifiers_count' => $modifiersCount,
            'total_sales' => (string) $totalSales,
            'total_tax' => (string) $totalTax,
            'total_discount' => (string) $totalDiscount,
            'payments' => [
                'cash' => (string) $cashPayments,
                'card' => (string) $cardPayments,
                'other' => (string) $otherPayments,
            ],
        ];
    }
}
