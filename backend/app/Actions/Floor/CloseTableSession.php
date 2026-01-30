<?php

namespace App\Actions\Floor;

use App\Models\TableSession;
use Illuminate\Validation\ValidationException;

class CloseTableSession
{
    public function __invoke(string $uuid): TableSession
    {
        /** @var TableSession $session */
        $session = TableSession::where('uuid', $uuid)->firstOrFail();

        if ($session->status === 'CLOSED') {
            throw ValidationException::withMessages([
                'uuid' => ['This table session is already closed.'],
            ]);
        }

        // Check if there are unpaid orders
        $unpaidOrders = $session->orders()
            ->whereIn('payment_status', ['UNPAID', 'PARTIALLY_PAID'])
            ->whereNotIn('status', ['VOIDED', 'REFUNDED'])
            ->count();

        if ($unpaidOrders > 0) {
            throw ValidationException::withMessages([
                'uuid' => ['Cannot close session with unpaid orders.'],
            ]);
        }

        $session->update([
            'status' => 'CLOSED',
            'closed_at' => now(),
        ]);

        return $session->fresh();
    }
}
