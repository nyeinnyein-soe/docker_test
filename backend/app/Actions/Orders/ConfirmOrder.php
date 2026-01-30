<?php

namespace App\Actions\Orders;

use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmOrder
{
    public function __invoke(string $uuid): Order
    {
        return DB::transaction(function () use ($uuid) {
            /** @var Order $order */
            $order = Order::where('uuid', $uuid)->firstOrFail();

            if ($order->status !== 'OPEN') {
                throw ValidationException::withMessages([
                    'uuid' => ['Order cannot be confirmed. Current status: ' . $order->status],
                ]);
            }

            $currentVersion = $order->version;

            // Optimistic locking
            $updated = Order::where('id', $order->id)
                ->where('version', $currentVersion)
                ->update([
                    'status' => 'CONFIRMED',
                    'version' => $currentVersion + 1,
                    'updated_at' => now(),
                ]);

            if (! $updated) {
                throw ValidationException::withMessages([
                    'uuid' => ['Order was modified by another request. Please retry.'],
                ]);
            }

            // Update kitchen status for all items
            $order->items()->update(['kitchen_status' => 'SENT']);

            return $order->fresh(['items', 'taxLines', 'discounts', 'payments']);
        });
    }
}
