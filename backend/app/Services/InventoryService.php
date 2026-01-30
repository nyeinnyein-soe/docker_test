<?php

namespace App\Services;

use App\Models\InventoryLevel;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Decrement inventory for a sale (order).
     * Creates inventory transactions and updates inventory levels.
     */
    public function decrementForSale(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->is_voided) {
                continue;
            }

            $this->adjustInventory(
                storeId: $order->store_id,
                variantId: $item->variant_id,
                quantityChange: -$item->quantity,
                cost: $item->unit_cost,
                type: 'SALE',
                referenceType: 'ORDER',
                referenceUuid: $order->uuid,
                employeeId: $order->employee_id
            );
        }
    }

    /**
     * Rollback inventory for a voided order.
     * Creates return transactions to restore inventory.
     */
    public function rollbackForVoid(Order $order): void
    {
        foreach ($order->items as $item) {
            $this->adjustInventory(
                storeId: $order->store_id,
                variantId: $item->variant_id,
                quantityChange: $item->quantity, // Positive to add back
                cost: $item->unit_cost,
                type: 'VOID_RETURN',
                referenceType: 'ORDER',
                referenceUuid: $order->uuid,
                employeeId: $order->employee_id
            );
        }
    }

    /**
     * Rollback inventory for a single voided item.
     */
    public function rollbackForVoidItem(OrderItem $item, Order $order): void
    {
        $this->adjustInventory(
            storeId: $order->store_id,
            variantId: $item->variant_id,
            quantityChange: $item->quantity,
            cost: $item->unit_cost,
            type: 'VOID_RETURN',
            referenceType: 'ORDER',
            referenceUuid: $order->uuid,
            employeeId: $order->employee_id
        );
    }

    /**
     * Core inventory adjustment logic with optimistic locking.
     */
    private function adjustInventory(
        int $storeId,
        int $variantId,
        float $quantityChange,
        float $cost,
        string $type,
        string $referenceType,
        string $referenceUuid,
        int $employeeId
    ): void {
        DB::transaction(function () use (
            $storeId,
            $variantId,
            $quantityChange,
            $cost,
            $type,
            $referenceType,
            $referenceUuid,
            $employeeId
        ) {
            // Get or create inventory level
            $level = InventoryLevel::firstOrCreate(
                ['store_id' => $storeId, 'variant_id' => $variantId],
                [
                    'quantity_on_hand' => 0,
                    'quantity_committed' => 0,
                    'low_stock_threshold' => 5,
                    'version' => 1,
                    'updated_at' => now(),
                ]
            );

            // Update with optimistic locking
            $currentVersion = $level->version;
            $newQuantity = Money::add($level->quantity_on_hand, $quantityChange);

            $updated = InventoryLevel::where('id', $level->id)
                ->where('version', $currentVersion)
                ->update([
                    'quantity_on_hand' => $newQuantity,
                    'version' => $currentVersion + 1,
                    'updated_at' => now(),
                ]);

            // If optimistic lock failed, retry (simple approach)
            if (! $updated) {
                // Refresh and retry once
                $level->refresh();
                $newQuantity = Money::add($level->quantity_on_hand, $quantityChange);
                $level->update([
                    'quantity_on_hand' => $newQuantity,
                    'version' => $level->version + 1,
                    'updated_at' => now(),
                ]);
            }

            // Record transaction in ledger
            InventoryTransaction::create([
                'store_id' => $storeId,
                'variant_id' => $variantId,
                'employee_id' => $employeeId,
                'type' => $type,
                'quantity_change' => $quantityChange,
                'cost_at_time' => $cost,
                'reference_type' => $referenceType,
                'reference_uuid' => $referenceUuid,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Check if variant has sufficient stock.
     */
    public function hasStock(int $storeId, int $variantId, float $quantity): bool
    {
        $level = InventoryLevel::where('store_id', $storeId)
            ->where('variant_id', $variantId)
            ->first();

        if (! $level) {
            return true; // No inventory tracking, assume available
        }

        $available = Money::sub($level->quantity_on_hand, $level->quantity_committed);

        return Money::compare($available, $quantity) >= 0;
    }
}
