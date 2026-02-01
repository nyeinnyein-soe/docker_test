<?php

namespace App\Actions\Orders;

use App\Models\Modifier;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Services\DiscountService;
use App\Services\InventoryService;
use App\Services\TaxService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateOrder
{
    public function __construct(
        protected TaxService $taxService,
        protected DiscountService $discountService,
        protected InventoryService $inventoryService,
    ) {}

    public function __invoke(array $payload): Order
    {
        return DB::transaction(function () use ($payload) {
            $employee = $payload['employee'];
            $storeId = $employee->store_id;
            $store = Store::findOrFail($storeId);

            // Determine tax type: use provided value or fall back to store default
            $taxType = $payload['tax_type'] ?? $store->default_tax_type ?? 'NONE';

            // Snapshot the current store tax configuration
            $taxConfigSnapshot = [
                'commercial_tax_rate' => $store->commercial_tax_rate,
                'commercial_tax_inclusive' => $store->commercial_tax_inclusive,
                'service_charge_rate' => $store->service_charge_rate,
                'service_charge_inclusive' => $store->service_charge_inclusive,
            ];

            $order = Order::create([
                'uuid' => (string) Str::uuid(),
                'store_id' => $storeId,
                'shift_id' => $payload['shift_id'],
                'table_session_id' => $payload['table_session_id'] ?? null,
                'employee_id' => $employee->id,
                'customer_id' => $payload['customer_id'] ?? null,
                'order_number' => $payload['order_number'],
                'type' => $payload['type'],
                'tax_type' => $taxType,
                'tax_config_snapshot' => $taxConfigSnapshot,
                'status' => 'OPEN',
                'payment_status' => 'UNPAID',
                'version' => 1,
                'subtotal' => 0,
                'total_tax' => 0,
                'total_discount' => 0,
                'grand_total' => 0,
                'total_paid' => 0,
            ]);

            $subtotal = '0.00';
            $taxGroupId = null;

            foreach ($payload['items'] as $itemData) {
                /** @var ProductVariant $variant */
                $variant = ProductVariant::with('product')->findOrFail($itemData['variant_id']);

                $qty = $itemData['quantity'];
                $price = $variant->price;

                // Handle modifiers
                $modifiersPrice = '0.00';
                $modifiersCost = '0.00';
                $modifierModels = [];

                if (! empty($itemData['modifiers'])) {
                    $modifierModels = Modifier::whereIn('id', $itemData['modifiers'])->get();
                    foreach ($modifierModels as $modifier) {
                        $modifiersPrice = Money::add($modifiersPrice, $modifier->price_extra);
                        $modifiersCost = Money::add($modifiersCost, $modifier->cost_extra);
                    }
                }

                $unitPrice = Money::add($price, $modifiersPrice);
                $unitCost = Money::add($variant->cost, $modifiersCost);

                $lineSubtotal = Money::mul($unitPrice, $qty);
                $subtotal = Money::add($subtotal, $lineSubtotal);

                $orderItem = OrderItem::create([
                    'uuid' => (string) Str::uuid(),
                    'order_id' => $order->id,
                    'variant_id' => $variant->id,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'unit_cost' => $unitCost,
                    'total_line_amount' => $lineSubtotal,
                    'subtotal_after_discount' => $lineSubtotal, // Default to same as subtotal initially
                    'kitchen_status' => 'PENDING',
                    'is_voided' => false,
                ]);

                // Save order item modifiers
                foreach ($modifierModels as $modifier) {
                    OrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'modifier_id' => $modifier->id,
                        'price_charged' => $modifier->price_extra,
                        'cost_charged' => $modifier->cost_extra,
                    ]);
                }
            }

            // Update subtotal first
            $order->update(['subtotal' => $subtotal]);

            // Calculate and apply discount (refactored to distribute to items)
            $discountId = $payload['discount_id'] ?? null;
            $manualDiscount = $payload['manual_discount'] ?? null;
            $totalDiscount = $this->discountService->calculateAndApply(
                $order,
                $discountId,
                $manualDiscount,
                $employee->id
            );

            // Calculate taxable amount after discount using the distributed item discounts
            $order->load('items.variant.product');
            $taxableAmount = '0.00';
            foreach ($order->items as $item) {
                if ($item->variant->product?->is_taxable ?? true) {
                    $taxableAmount = Money::add($taxableAmount, $item->subtotal_after_discount);
                }
            }

            // Calculate tax using the new tax type system (now snapshot-aware)
            $taxBreakdown = $this->taxService->calculateByType($order, $taxType, $store, $taxableAmount);
            $totalTax = $taxBreakdown['total_tax'];
            $exclusiveTax = $taxBreakdown['exclusive_tax'];

            // Grand total = subtotal + exclusive tax - discount
            $grandTotal = Money::add($subtotal, $exclusiveTax);
            $grandTotal = Money::sub($grandTotal, $totalDiscount);

            $order->update([
                'total_tax' => $totalTax,
                'total_discount' => $totalDiscount,
                'grand_total' => $grandTotal,
            ]);

            // Decrement inventory for sold items
            $order->load('items');
            $this->inventoryService->decrementForSale($order);

            return $order->load(['items', 'taxLines', 'discounts']);
        });
    }
}

