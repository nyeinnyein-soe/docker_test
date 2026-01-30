<?php

namespace App\Actions\Auth;

use App\Models\Employee;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginEmployee
{
    public function __invoke(array $data): array
    {
        $query = Employee::where('email', $data['email']);
        
        if (!empty($data['store_id'])) {
            $query->where('store_id', $data['store_id']);
        }
        
        $employee = $query->first();

        if (! $employee || ! Hash::check($data['pin'], $employee->pin_hash) || ! $employee->is_active) {
            throw ValidationException::withMessages([
                'pin' => ['The provided credentials are incorrect.'],
            ]);
        }

        $abilities = $employee->role?->permissions ?? [];

        $token = $employee->createToken('pos-device', $abilities)->plainTextToken;

        return [
            'token' => $token,
            'employee' => [
                'id' => $employee->id,
                'uuid' => $employee->uuid,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
            ],
            'store_id' => $employee->store_id,
            'role' => $employee->role?->name,
            'permissions' => $abilities,
        ];
    }
}

