<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderTaxLine;
use App\Models\Store;
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

    /**
     * Calculate and apply taxes based on tax type (NONE, COMMERCIAL, SERVICE, BOTH).
     *
     * @param  Order  $order
     * @param  string  $taxType  One of: NONE, COMMERCIAL, SERVICE, BOTH
     * @param  Store  $store
     * @param  string|float  $taxableAmount  The amount to calculate tax on (only from taxable items)
     * @return string Total tax amount
     */
    public function calculateByType(Order $order, string $taxType, Store $store, string|float $taxableAmount): array
    {
        if ($taxType === 'NONE' || (float) $taxableAmount <= 0) {
            return [
                'total_tax' => '0.00',
                'exclusive_tax' => '0.00',
                'inclusive_tax' => '0.00',
            ];
        }

        $totalTax = '0.00';
        $exclusiveTax = '0.00';
        $inclusiveTax = '0.00';

        // Use snapshot from order if available, otherwise use live store settings
        $config = $order->tax_config_snapshot ?? [
            'commercial_tax_rate' => $store->commercial_tax_rate,
            'commercial_tax_inclusive' => $store->commercial_tax_inclusive,
            'service_charge_rate' => $store->service_charge_rate,
            'service_charge_inclusive' => $store->service_charge_inclusive,
        ];

        // Apply Commercial Tax if applicable
        $commRate = $config['commercial_tax_rate'] ?? 0;
        $commIncl = $config['commercial_tax_inclusive'] ?? false;

        if (in_array($taxType, ['COMMERCIAL', 'BOTH']) && (float) $commRate > 0) {
            $taxAmount = $this->calculateTaxAmount(
                $taxableAmount,
                $commRate,
                $commIncl
            );

            OrderTaxLine::create([
                'order_id' => $order->id,
                'tax_name' => 'Commercial Tax',
                'tax_rate' => $commRate,
                'tax_amount' => $taxAmount,
                'created_at' => now(),
            ]);

            $totalTax = Money::add($totalTax, $taxAmount);
            if ($commIncl) {
                $inclusiveTax = Money::add($inclusiveTax, $taxAmount);
            } else {
                $exclusiveTax = Money::add($exclusiveTax, $taxAmount);
            }
        }

        // Apply Service Charge if applicable
        $serviceRate = $config['service_charge_rate'] ?? 0;
        $serviceIncl = $config['service_charge_inclusive'] ?? false;

        if (in_array($taxType, ['SERVICE', 'BOTH']) && (float) $serviceRate > 0) {
            $taxAmount = $this->calculateTaxAmount(
                $taxableAmount,
                $serviceRate,
                $serviceIncl
            );

            OrderTaxLine::create([
                'order_id' => $order->id,
                'tax_name' => 'Service Charge',
                'tax_rate' => $serviceRate,
                'tax_amount' => $taxAmount,
                'created_at' => now(),
            ]);

            $totalTax = Money::add($totalTax, $taxAmount);
            if ($serviceIncl) {
                $inclusiveTax = Money::add($inclusiveTax, $taxAmount);
            } else {
                $exclusiveTax = Money::add($exclusiveTax, $taxAmount);
            }
        }

        return [
            'total_tax' => $totalTax,
            'exclusive_tax' => $exclusiveTax,
            'inclusive_tax' => $inclusiveTax,
        ];
    }

    /**
     * Preview tax calculation by type without persisting.
     *
     * @param  string|float  $taxableAmount
     * @param  string  $taxType
     * @param  Store  $store
     * @return array
     */
    public function previewByType(string|float $taxableAmount, string $taxType, Store $store): array
    {
        if ($taxType === 'NONE' || (float) $taxableAmount <= 0) {
            return ['total_tax' => '0.00', 'lines' => []];
        }

        $totalTax = '0.00';
        $lines = [];

        // Apply Commercial Tax if applicable
        if (in_array($taxType, ['COMMERCIAL', 'BOTH']) && (float) $store->commercial_tax_rate > 0) {
            $taxAmount = $this->calculateTaxAmount(
                $taxableAmount,
                $store->commercial_tax_rate,
                $store->commercial_tax_inclusive
            );

            $lines[] = [
                'name' => 'Commercial Tax',
                'rate' => $store->commercial_tax_rate,
                'amount' => $taxAmount,
                'is_inclusive' => $store->commercial_tax_inclusive,
            ];

            $totalTax = Money::add($totalTax, $taxAmount);
        }

        // Apply Service Charge if applicable
        if (in_array($taxType, ['SERVICE', 'BOTH']) && (float) $store->service_charge_rate > 0) {
            $taxAmount = $this->calculateTaxAmount(
                $taxableAmount,
                $store->service_charge_rate,
                $store->service_charge_inclusive
            );

            $lines[] = [
                'name' => 'Service Charge',
                'rate' => $store->service_charge_rate,
                'amount' => $taxAmount,
                'is_inclusive' => $store->service_charge_inclusive,
            ];

            $totalTax = Money::add($totalTax, $taxAmount);
        }

        return [
            'total_tax' => $totalTax,
            'lines' => $lines,
        ];
    }
}
