<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditLogger
{
    /**
     * Log an audit event.
     */
    public function log(
        int $storeId,
        int $employeeId,
        string $eventType,
        ?string $tableName = null,
        ?int $recordId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): AuditLog {
        return AuditLog::create([
            'store_id' => $storeId,
            'employee_id' => $employeeId,
            'event_type' => $eventType,
            'table_name' => $tableName,
            'record_id' => $recordId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'created_at' => now(),
        ]);
    }

    /**
     * Log a shift open event.
     */
    public function logShiftOpen(int $storeId, int $employeeId, int $shiftId, array $shiftData): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'SHIFT_OPEN',
            tableName: 'shifts',
            recordId: $shiftId,
            newValues: $shiftData,
            description: "Shift opened with starting cash: {$shiftData['starting_cash']}"
        );
    }

    /**
     * Log a shift close event.
     */
    public function logShiftClose(int $storeId, int $employeeId, int $shiftId, array $oldData, array $newData): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'SHIFT_CLOSE',
            tableName: 'shifts',
            recordId: $shiftId,
            oldValues: $oldData,
            newValues: $newData,
            description: "Shift closed. Difference: {$newData['difference']}"
        );
    }

    /**
     * Log an order creation event.
     */
    public function logOrderCreate(int $storeId, int $employeeId, int $orderId, array $orderData): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'ORDER_CREATE',
            tableName: 'orders',
            recordId: $orderId,
            newValues: $orderData,
            description: "Order #{$orderData['order_number']} created. Total: {$orderData['grand_total']}"
        );
    }

    /**
     * Log an order void event.
     */
    public function logOrderVoid(int $storeId, int $employeeId, int $orderId, array $oldData, ?string $reason = null): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'ORDER_VOID',
            tableName: 'orders',
            recordId: $orderId,
            oldValues: $oldData,
            newValues: ['status' => 'VOIDED'],
            description: $reason ? "Order voided. Reason: {$reason}" : 'Order voided'
        );
    }

    /**
     * Log a payment event.
     */
    public function logPayment(int $storeId, int $employeeId, int $paymentId, int $orderId, array $paymentData): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'PAYMENT_CREATE',
            tableName: 'payments',
            recordId: $paymentId,
            newValues: $paymentData,
            description: "Payment of {$paymentData['amount']} via {$paymentData['method']} for order #{$orderId}"
        );
    }

    /**
     * Log a refund event.
     */
    public function logRefund(int $storeId, int $employeeId, int $paymentId, int $orderId, array $refundData): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'REFUND_CREATE',
            tableName: 'payments',
            recordId: $paymentId,
            newValues: $refundData,
            description: "Refund of {$refundData['amount']} for order #{$orderId}"
        );
    }

    /**
     * Log a table session open event.
     */
    public function logTableSessionOpen(int $storeId, int $employeeId, int $sessionId, array $sessionData): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'TABLE_SESSION_OPEN',
            tableName: 'table_sessions',
            recordId: $sessionId,
            newValues: $sessionData,
            description: "Table session opened for {$sessionData['guest_count']} guests"
        );
    }

    /**
     * Log a drawer open (no sale) event.
     */
    public function logDrawerOpenNoSale(int $storeId, int $employeeId, ?string $reason = null): AuditLog
    {
        return $this->log(
            storeId: $storeId,
            employeeId: $employeeId,
            eventType: 'DRAWER_OPEN_NO_SALE',
            description: $reason ?? 'Cash drawer opened without sale'
        );
    }
}
