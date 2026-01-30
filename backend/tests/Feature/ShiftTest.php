<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Role;
use App\Models\Shift;
use App\Models\Store;
use App\Models\Terminal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ShiftTest extends TestCase
{
    use RefreshDatabase;

    protected Store $store;
    protected Terminal $terminal;
    protected Employee $employee;
    protected string $token;

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

        $this->terminal = Terminal::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'name' => 'Terminal 1',
            'is_active' => true,
        ]);

        $role = Role::create([
            'store_id' => $this->store->id,
            'name' => 'Manager',
            'permissions' => ['void_order'],
        ]);

        $this->employee = Employee::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'role_id' => $role->id,
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'pin_hash' => Hash::make('1234'),
            'is_active' => true,
        ]);

        $this->token = $this->employee->createToken('test')->plainTextToken;
    }

    public function test_employee_can_open_shift(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/shifts/open', [
                'terminal_uuid' => $this->terminal->uuid,
                'starting_cash' => 100.00,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'OPEN')
            ->assertJsonPath('data.starting_cash', '100.00')
            ->assertJsonPath('data.store_id', $this->store->id)
            ->assertJsonPath('data.employee_id', $this->employee->id);

        $this->assertDatabaseHas('shifts', [
            'store_id' => $this->store->id,
            'employee_id' => $this->employee->id,
            'status' => 'OPEN',
        ]);
    }

    public function test_employee_can_get_current_shift(): void
    {
        Shift::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'employee_id' => $this->employee->id,
            'terminal_id' => $this->terminal->id,
            'starting_cash' => 100.00,
            'status' => 'OPEN',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/shifts/current');

        $response->assertOk()
            ->assertJsonPath('data.status', 'OPEN');
    }

    public function test_returns_404_when_no_open_shift(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/shifts/current');

        $response->assertNotFound()
            ->assertJsonPath('message', 'No open shift found');
    }

    public function test_employee_can_close_shift(): void
    {
        $shift = Shift::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'employee_id' => $this->employee->id,
            'terminal_id' => $this->terminal->id,
            'starting_cash' => 100.00,
            'expected_cash' => 0,
            'actual_cash' => 0,
            'difference' => 0,
            'status' => 'OPEN',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/shifts/{$shift->id}/close", [
                'actual_cash' => 150.00,
            ]);

        $response->assertOk()
            ->assertJsonPath('status', 'CLOSED')
            ->assertJsonPath('actual_cash', '150.00');
    }
}
