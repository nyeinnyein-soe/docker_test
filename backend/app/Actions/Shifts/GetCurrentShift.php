<?php

namespace App\Actions\Shifts;

use App\Models\Employee;
use App\Models\Shift;

class GetCurrentShift
{
    public function __invoke(Employee $employee): ?Shift
    {
        return Shift::where('store_id', $employee->store_id)
            ->where('employee_id', $employee->id)
            ->where('status', 'OPEN')
            ->first();
    }
}
