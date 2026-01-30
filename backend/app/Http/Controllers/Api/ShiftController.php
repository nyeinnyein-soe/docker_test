<?php

namespace App\Http\Controllers\Api;

use App\Actions\Shifts\CloseShift;
use App\Actions\Shifts\GetCurrentShift;
use App\Actions\Shifts\GetShiftStats;
use App\Actions\Shifts\OpenShift;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function open(Request $request, OpenShift $openShift)
    {
        $data = $request->validate([
            'terminal_uuid' => ['nullable', 'uuid'],
            'starting_cash' => ['required', 'numeric', 'min:0'],
        ]);

        $data['employee'] = $request->user();

        $shift = $openShift($data);

        return response()->json(['data' => $shift]);
    }

    public function current(Request $request, GetCurrentShift $getCurrentShift, GetShiftStats $getShiftStats)
    {
        $shift = $getCurrentShift($request->user());

        if (! $shift) {
            return response()->json(['message' => 'No open shift found'], 404);
        }

        $shift->load(['terminal', 'employee']);
        $stats = $getShiftStats($shift);

        return response()->json([
            'data' => $shift,
            'stats' => $stats,
        ]);
    }

    public function close(int $id, Request $request, CloseShift $closeShift)
    {
        $data = $request->validate([
            'actual_cash' => ['required', 'numeric', 'min:0'],
        ]);

        $shift = $closeShift($id, $data);

        return response()->json($shift);
    }
}

