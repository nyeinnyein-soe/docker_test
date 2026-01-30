<?php

namespace App\Actions\Floor;

use App\Models\DiningTable;
use App\Models\TableSession;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OpenTableSession
{
    public function __invoke(array $data): TableSession
    {
        /** @var DiningTable $table */
        $table = DiningTable::findOrFail($data['table_id']);

        // Check if table already has an active session
        $existingSession = TableSession::where('table_id', $table->id)
            ->whereIn('status', ['ACTIVE', 'PAYING'])
            ->first();

        if ($existingSession) {
            throw ValidationException::withMessages([
                'table_id' => ['This table already has an active session.'],
            ]);
        }

        return TableSession::create([
            'uuid' => (string) Str::uuid(),
            'table_id' => $table->id,
            'waiter_id' => $data['waiter_id'],
            'guest_count' => $data['guest_count'] ?? 1,
            'status' => 'ACTIVE',
            'opened_at' => now(),
            'closed_at' => null,
        ]);
    }
}
