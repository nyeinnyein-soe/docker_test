<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected Store $store;
    protected Role $role;
    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test Store',
            'currency_code' => 'USD',
            'time_zone' => 'UTC',
            'is_active' => true,
        ]);

        $this->role = Role::create([
            'store_id' => $this->store->id,
            'name' => 'Manager',
            'permissions' => ['void_order', 'refund_payment'],
        ]);

        $this->employee = Employee::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'role_id' => $this->role->id,
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'pin_hash' => Hash::make('1234'),
            'is_active' => true,
        ]);
    }

    public function test_employee_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'store_id' => $this->store->id,
            'email' => 'test@example.com',
            'pin' => '1234',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'employee' => ['id', 'uuid', 'first_name', 'last_name', 'email'],
                    'store_id',
                    'role',
                    'permissions',
                ],
            ]);
    }

    public function test_employee_cannot_login_with_invalid_pin(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'store_id' => $this->store->id,
            'email' => 'test@example.com',
            'pin' => '9999',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['pin']);
    }

    public function test_employee_cannot_login_with_invalid_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'store_id' => $this->store->id,
            'email' => 'wrong@example.com',
            'pin' => '1234',
        ]);

        $response->assertUnprocessable();
    }

    public function test_authenticated_employee_can_get_profile(): void
    {
        $token = $this->employee->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('id', $this->employee->id)
            ->assertJsonPath('email', 'test@example.com');
    }

    public function test_authenticated_employee_can_logout(): void
    {
        $token = $this->employee->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJsonPath('message', 'Logged out');
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertUnauthorized();
    }
}
