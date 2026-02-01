<?php

namespace App\Actions\Orders;

use App\Models\Order;
use App\Models\Store;
use App\Services\TaxService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

class UpdateOrderTax
{
    public function __construct(
        protected TaxService $taxService,
    ) {}

    public function __invoke(string $uuid, string $taxType): Order
    {
        return DB::transaction(function () use ($uuid, $taxType) {
            $order = Order::where('uuid', $uuid)->with(['items.variant.product', 'discounts', 'store'])->firstOrFail();
            $store = $order->store;

            // 1. Update tax type
            $order->tax_type = $taxType;

            // 2. Delete existing tax lines
            $order->taxLines()->delete();

            // 3. Calculate taxable amount using fixed item-level discounts
            $subtotal = $order->subtotal;
            $taxableAmount = '0.00';
            foreach ($order->items as $item) {
                if ($item->variant->product?->is_taxable ?? true) {
                    $taxableAmount = Money::add($taxableAmount, $item->subtotal_after_discount);
                }
            }

            // 4. Calculate new taxes (TaxService is now snapshot-aware)
            $taxBreakdown = $this->taxService->calculateByType($order, $taxType, $store, $taxableAmount);
            $totalTax = $taxBreakdown['total_tax'];
            $exclusiveTax = $taxBreakdown['exclusive_tax'];

            // 5. Update grand total (subtotal + exclusive tax - total_discount)
            // Note: total_discount is already persisted on the order
            $grandTotal = Money::add($subtotal, $exclusiveTax);
            $grandTotal = Money::sub($grandTotal, $order->total_discount);

            $order->update([
                'tax_type' => $taxType,
                'total_tax' => $totalTax,
                'grand_total' => $grandTotal,
            ]);

            return $order->load(['items', 'taxLines', 'payments']);
        });
    }
}
