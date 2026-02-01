<?php

namespace App\Actions\Orders;

use App\Models\Order;
use App\Models\TableSession;
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

            // Auto-close table session if no more active orders
            $this->autoCloseTableSessionIfEmpty($order);

            return $order->fresh(['items', 'taxLines', 'discounts', 'payments']);
        });
    }

    /**
     * Automatically close the table session if there are no more active orders.
     */
    private function autoCloseTableSessionIfEmpty(Order $order): void
    {
        if (! $order->table_session_id) {
            return;
        }

        // Check if there are any remaining active orders for this session
        $activeOrders = Order::where('table_session_id', $order->table_session_id)
            ->whereNotIn('status', ['VOIDED', 'REFUNDED'])
            ->count();

        if ($activeOrders === 0) {
            $session = TableSession::find($order->table_session_id);
            if ($session && $session->status !== 'CLOSED') {
                $session->update([
                    'status' => 'CLOSED',
                    'closed_at' => now(),
                ]);
            }
        }
    }
}
