<?php

namespace App\Actions\Orders;

use App\Models\Order;
use App\Services\AuditLogger;
use App\Services\InventoryService;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoidOrder
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected AuditLogger $auditLogger,
    ) {}

    public function __invoke(string $uuid, array $data): Order
    {
        return DB::transaction(function () use ($uuid, $data) {
            /** @var Order $order */
            $order = Order::where('uuid', $uuid)->firstOrFail();

            if (in_array($order->status, ['VOIDED', 'REFUNDED'])) {
                throw ValidationException::withMessages([
                    'uuid' => ['Order is already voided or refunded.'],
                ]);
            }

            // Cannot void a paid order (should use refund instead)
            if ($order->payment_status === 'PAID' && Money::compare($order->total_paid, 0) > 0) {
                throw ValidationException::withMessages([
                    'uuid' => ['Cannot void a paid order. Use refund instead.'],
                ]);
            }

            $currentVersion = $order->version;
            $oldStatus = $order->status;

            // Optimistic locking
            $updated = Order::where('id', $order->id)
                ->where('version', $currentVersion)
                ->update([
                    'status' => 'VOIDED',
                    'version' => $currentVersion + 1,
                    'updated_at' => now(),
                ]);

            if (! $updated) {
                throw ValidationException::withMessages([
                    'uuid' => ['Order was modified by another request. Please retry.'],
                ]);
            }

            // Rollback inventory
            $order->load('items');
            $this->inventoryService->rollbackForVoid($order);

            // Audit log
            $employee = $data['employee'];
            $this->auditLogger->logOrderVoid(
                $order->store_id,
                $employee->id,
                $order->id,
                ['status' => $oldStatus, 'grand_total' => $order->grand_total],
                $data['reason'] ?? null
            );

            return $order->fresh(['items', 'taxLines', 'discounts', 'payments']);
        });
    }
}
