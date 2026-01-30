<?php

namespace App\Http\Controllers\Api;

use App\Actions\Menu\GetMenuForTerminal;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function show(Request $request, GetMenuForTerminal $getMenuForTerminal)
    {
        $data = $request->validate([
            'terminal_uuid' => ['required', 'uuid'],
        ]);

        $result = $getMenuForTerminal($data['terminal_uuid']);

        return response()->json($result);
    }
}

