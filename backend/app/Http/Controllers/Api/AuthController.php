<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\LoginEmployee;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request, LoginEmployee $loginEmployee)
    {
        $data = $request->validate([
            'store_id' => ['nullable', 'integer'],
            'email' => ['required', 'email'],
            'pin' => ['required', 'string', 'min:4', 'max:6'],
        ]);

        $result = $loginEmployee($data);

        return response()->json(['data' => $result]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role', 'store'));
    }
}

