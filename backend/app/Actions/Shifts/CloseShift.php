<?php

namespace App\Actions\Shifts;

use App\Models\Payment;
use App\Models\Shift;
use App\Services\AuditLogger;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CloseShift
{
    public function __construct(
        protected AuditLogger $auditLogger,
    ) {}

    public function __invoke(int $shiftId, array $data): Shift
    {
        return DB::transaction(function () use ($shiftId, $data) {
            /** @var Shift $shift */
            $shift = Shift::findOrFail($shiftId);

            if ($shift->status === 'CLOSED') {
                throw ValidationException::withMessages([
                    'shift_id' => ['This shift is already closed.'],
                ]);
            }

            $oldData = [
                'status' => $shift->status,
                'starting_cash' => $shift->starting_cash,
            ];

            // Calculate expected cash from payments during this shift
            $cashPayments = Payment::where('shift_id', $shift->id)
                ->where('method', 'CASH')
                ->where('status', 'SUCCESS')
                ->sum('amount');

            $expectedCash = Money::add($shift->starting_cash, $cashPayments);
            $actualCash = $data['actual_cash'];
            $difference = Money::sub($actualCash, $expectedCash);

            $shift->update([
                'status' => 'CLOSED',
                'end_time' => now(),
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'difference' => $difference,
            ]);

            $this->auditLogger->logShiftClose(
                $shift->store_id,
                $shift->employee_id,
                $shift->id,
                $oldData,
                [
                    'status' => 'CLOSED',
                    'expected_cash' => $expectedCash,
                    'actual_cash' => $actualCash,
                    'difference' => $difference,
                ]
            );

            return $shift->fresh();
        });
    }
}
