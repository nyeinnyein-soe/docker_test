<?php

namespace App\Actions\Orders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\TableSession;
use App\Models\Terminal;
use App\Services\AuditLogger;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PayOrder
{
    public function __construct(
        protected AuditLogger $auditLogger,
    ) {}

    public function __invoke(array $payload): Order
    {
        return DB::transaction(function () use ($payload) {
            /** @var Order $order */
            $order = Order::where('uuid', $payload['order_uuid'])->firstOrFail();
            $employee = $payload['employee'];

            // Get terminal by UUID or auto-select first available for the store
            $terminal = null;
            if (!empty($payload['terminal_uuid']) && $payload['terminal_uuid'] !== 'default') {
                $terminal = Terminal::where('uuid', $payload['terminal_uuid'])->first();
            }
            
            if (!$terminal) {
                $terminal = Terminal::where('store_id', $order->store_id)
                    ->where('is_active', true)
                    ->first();
            }

            $amount = $payload['amount'];
            $tip = $payload['tip_amount'] ?? 0;

            $payment = Payment::create([
                'uuid' => (string) Str::uuid(),
                'store_id' => $order->store_id,
                'order_id' => $order->id,
                'shift_id' => $payload['shift_id'],
                'terminal_id' => $terminal?->id,
                'type' => 'PAYMENT',
                'method' => $payload['method'],
                'status' => 'SUCCESS',
                'amount' => $amount,
                'tip_amount' => $tip,
                'external_ref' => $payload['external_ref'] ?? null,
                'parent_payment_id' => null,
            ]);

            $this->auditLogger->logPayment(
                $order->store_id,
                $employee->id,
                $payment->id,
                $order->id,
                [
                    'amount' => $amount,
                    'method' => $payload['method'],
                    'tip_amount' => $tip,
                ]
            );

            $newTotalPaid = Money::add($order->total_paid, $amount);

            $paymentStatus = 'PARTIALLY_PAID';
            if (Money::compare($newTotalPaid, $order->grand_total) >= 0) {
                $paymentStatus = 'PAID';
            }

            $order->update([
                'total_paid' => $newTotalPaid,
                'payment_status' => $paymentStatus,
                'status' => $paymentStatus === 'PAID' ? 'COMPLETED' : $order->status,
            ]);

            // Auto-close table session if all orders are paid
            if ($paymentStatus === 'PAID') {
                $this->autoCloseTableSessionIfAllPaid($order);
            }

            return $order->fresh(['items', 'payments']);
        });
    }

    /**
     * Automatically close the table session if all orders are paid.
     */
    private function autoCloseTableSessionIfAllPaid(Order $order): void
    {
        if (! $order->table_session_id) {
            return;
        }

        // Check if there are any remaining unpaid orders for this session
        $unpaidOrders = Order::where('table_session_id', $order->table_session_id)
            ->whereIn('payment_status', ['UNPAID', 'PARTIALLY_PAID'])
            ->whereNotIn('status', ['VOIDED', 'REFUNDED'])
            ->count();

        if ($unpaidOrders === 0) {
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

