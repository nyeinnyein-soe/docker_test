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

        $totalSubtotal = $order->subtotal;
        $discountAmount = $this->calculateAmount(
            $totalSubtotal,
            $discountType,
            $discountValue
        );

        // Don't allow discount greater than subtotal
        if (Money::compare($discountAmount, $totalSubtotal) > 0) {
            $discountAmount = Money::format($totalSubtotal);
        }

        // Apply discount proportionally to each item
        if (Money::compare($discountAmount, '0.00') > 0 && Money::compare($totalSubtotal, '0.00') > 0) {
            $items = $order->items;
            $remainingDiscount = $discountAmount;

            foreach ($items as $index => $item) {
                $itemDiscount = '0.00';
                
                // If it's the last item, assign the remainder to avoid rounding issues
                if ($index === count($items) - 1) {
                    $itemDiscount = $remainingDiscount;
                } else {
                    $ratio = (float) $item->total_line_amount / (float) $totalSubtotal;
                    $itemDiscount = Money::mul($discountAmount, $ratio);
                }

                $item->update([
                    'discount_amount' => $itemDiscount,
                    'subtotal_after_discount' => Money::sub($item->total_line_amount, $itemDiscount),
                ]);

                $remainingDiscount = Money::sub($remainingDiscount, $itemDiscount);
            }
        } else {
            // Ensure 0 discount for items if no total discount
            $order->items()->update([
                'discount_amount' => '0.00',
                'subtotal_after_discount' => DB::raw('total_line_amount'),
            ]);
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
