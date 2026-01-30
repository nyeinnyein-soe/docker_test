<?php

namespace App\Actions\Shifts;

use App\Models\Shift;
use App\Models\Terminal;
use App\Services\AuditLogger;
use Illuminate\Support\Str;

class OpenShift
{
    public function __construct(
        protected AuditLogger $auditLogger,
    ) {}

    public function __invoke(array $data): Shift
    {
        $employee = $data['employee'];

        // Get terminal by UUID or auto-select first available for the store
        $terminal = null;
        if (!empty($data['terminal_uuid'])) {
            $terminal = Terminal::where('uuid', $data['terminal_uuid'])->first();
        }
        
        if (!$terminal) {
            $terminal = Terminal::where('store_id', $employee->store_id)
                ->where('is_active', true)
                ->first();
        }

        $shift = Shift::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $employee->store_id,
            'employee_id' => $employee->id,
            'terminal_id' => $terminal?->id,
            'starting_cash' => $data['starting_cash'],
            'expected_cash' => 0,
            'actual_cash' => 0,
            'difference' => 0,
            'status' => 'OPEN',
        ]);

        $this->auditLogger->logShiftOpen(
            $employee->store_id,
            $employee->id,
            $shift->id,
            ['starting_cash' => $data['starting_cash'], 'terminal_id' => $terminal?->id]
        );

        return $shift;
    }
}

