<?php

namespace App\Http\Controllers\Api;

use App\Actions\Floor\CloseTableSession;
use App\Actions\Floor\GetFloorLayout;
use App\Actions\Floor\OpenTableSession;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FloorController extends Controller
{
    public function index(Request $request, GetFloorLayout $getFloorLayout)
    {
        $employee = $request->user();

        $result = $getFloorLayout($employee->store_id);

        // Return floors array directly (already wrapped in 'data' by GetFloorLayout)
        return response()->json($result);
    }

    public function openSession(Request $request, OpenTableSession $openTableSession)
    {
        $data = $request->validate([
            'table_id' => ['required', 'integer'],
            'guest_count' => ['nullable', 'integer', 'min:1'],
        ]);

        $data['waiter_id'] = $request->user()->id;

        $session = $openTableSession($data);

        return response()->json(['data' => $session], 201);
    }

    public function closeSession(string $uuid, CloseTableSession $closeTableSession)
    {
        $session = $closeTableSession($uuid);

        return response()->json($session);
    }
}
