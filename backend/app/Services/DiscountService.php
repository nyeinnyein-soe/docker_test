<?php

namespace App\Services;

use App\Models\Discount;
use App\Models\Order;
use App\Models\OrderDiscount;
use App\Support\Money;
use Illuminate\Validation\ValidationException;

class DiscountService
{
    /**
     * Apply a discount to an order.
     *
     * @param  Order  $order
     * @param  int|null  $discountId  Use a predefined discount
     * @param  array|null  $manualDiscount  Manual discount { 'name', 'type', 'value' }
     * @param  int  $employeeId
     * @return string Discount amount
     */
    public function calculateAndApply(
        Order $order,
        ?int $discountId,
        ?array $manualDiscount,
        int $employeeId
    ): string {
        // If no discount specified, return 0
        if (! $discountId && ! $manualDiscount) {
            return '0.00';
        }

        $discountName = '';
        $discountType = '';
        $discountValue = '0.00';

        if ($discountId) {
            $discount = Discount::where('id', $discountId)
                ->where('store_id', $order->store_id)
                ->first();

            if (! $discount) {
                throw ValidationException::withMessages([
                    'discount_id' => ['Discount not found.'],
                ]);
            }

            if (! $discount->isValid()) {
                throw ValidationException::withMessages([
                    'discount_id' => ['Discount is not currently valid.'],
                ]);
            }

            $discountName = $discount->name;
            $discountType = $discount->type;
            $discountValue = $discount->value;
        } elseif ($manualDiscount) {
            $discountName = $manualDiscount['name'] ?? 'Manual Discount';
            $discountType = $manualDiscount['type'] ?? 'FIXED_AMOUNT';
            $discountValue = $manualDiscount['value'] ?? 0;
        }

        $discountAmount = $this->calculateAmount(
            $order->subtotal,
            $discountType,
            $discountValue
        );

        // Don't allow discount greater than subtotal
        if (Money::compare($discountAmount, $order->subtotal) > 0) {
            $discountAmount = Money::format($order->subtotal);
        }

        // Create snapshot
        OrderDiscount::create([
            'order_id' => $order->id,
            'name' => $discountName,
            'amount' => $discountAmount,
            'applied_by_employee_id' => $employeeId,
            'created_at' => now(),
        ]);

        return $discountAmount;
    }

    /**
     * Calculate discount amount.
     */
    private function calculateAmount(string|float $subtotal, string $type, string|float $value): string
    {
        if ($type === 'PERCENTAGE') {
            // value is percentage (e.g., 10 for 10%)
            $rate = (float) $value / 100;
            return Money::mul($subtotal, $rate);
        }

        // FIXED_AMOUNT
        return Money::format($value);
    }

    /**
     * Preview discount without persisting.
     */
    public function preview(string|float $subtotal, string $type, string|float $value): string
    {
        $amount = $this->calculateAmount($subtotal, $type, $value);

        // Cap at subtotal
        if (Money::compare($amount, $subtotal) > 0) {
            return Money::format($subtotal);
        }

        return $amount;
    }
}
