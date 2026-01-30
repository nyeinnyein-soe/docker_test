<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderTaxLine;
use App\Models\TaxGroup;
use App\Support\Money;

class TaxService
{
    /**
     * Calculate and apply taxes to an order.
     *
     * @param  Order  $order
     * @param  int|null  $taxGroupId
     * @return string Total tax amount
     */
    public function calculateAndApply(Order $order, ?int $taxGroupId): string
    {
        if (! $taxGroupId) {
            return '0.00';
        }

        $taxGroup = TaxGroup::with('taxes')->find($taxGroupId);

        if (! $taxGroup) {
            return '0.00';
        }

        $subtotal = $order->subtotal;
        $totalTax = '0.00';
        $taxableAmount = $subtotal;

        // Apply taxes in priority order
        foreach ($taxGroup->taxes as $tax) {
            $taxAmount = $this->calculateTaxAmount($taxableAmount, $tax->rate, $tax->is_inclusive);

            // Create snapshot
            OrderTaxLine::create([
                'order_id' => $order->id,
                'tax_name' => $tax->name,
                'tax_rate' => $tax->rate,
                'tax_amount' => $taxAmount,
                'created_at' => now(),
            ]);

            $totalTax = Money::add($totalTax, $taxAmount);

            // For compound taxes, the next tax is calculated on subtotal + previous taxes
            // (Uncomment if you want compound taxes)
            // $taxableAmount = Money::add($taxableAmount, $taxAmount);
        }

        return $totalTax;
    }

    /**
     * Calculate tax amount for a given base amount.
     */
    private function calculateTaxAmount(string|float $baseAmount, string|float $rate, bool $isInclusive): string
    {
        if ($isInclusive) {
            // Tax is included in the price, extract it
            // Formula: tax = baseAmount - (baseAmount / (1 + rate))
            $divisor = 1 + (float) $rate;
            $preTaxAmount = Money::div($baseAmount, $divisor);
            return Money::sub($baseAmount, $preTaxAmount);
        }

        // Tax is exclusive (added on top)
        return Money::mul($baseAmount, $rate);
    }

    /**
     * Calculate tax preview without persisting.
     */
    public function preview(string|float $subtotal, ?int $taxGroupId): array
    {
        if (! $taxGroupId) {
            return ['total_tax' => '0.00', 'lines' => []];
        }

        $taxGroup = TaxGroup::with('taxes')->find($taxGroupId);

        if (! $taxGroup) {
            return ['total_tax' => '0.00', 'lines' => []];
        }

        $totalTax = '0.00';
        $lines = [];
        $taxableAmount = $subtotal;

        foreach ($taxGroup->taxes as $tax) {
            $taxAmount = $this->calculateTaxAmount($taxableAmount, $tax->rate, $tax->is_inclusive);

            $lines[] = [
                'name' => $tax->name,
                'rate' => $tax->rate,
                'amount' => $taxAmount,
            ];

            $totalTax = Money::add($totalTax, $taxAmount);
        }

        return [
            'total_tax' => $totalTax,
            'lines' => $lines,
        ];
    }
}
