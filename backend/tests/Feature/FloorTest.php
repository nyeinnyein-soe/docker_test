<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\FloorSection;
use App\Models\Role;
use App\Models\Store;
use App\Models\TableSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class FloorTest extends TestCase
{
    use RefreshDatabase;

    protected Store $store;
    protected Employee $employee;
    protected FloorSection $section;
    protected DiningTable $table;
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

        $this->section = FloorSection::create([
            'store_id' => $this->store->id,
            'name' => 'Main Dining',
        ]);

        $this->table = DiningTable::create([
            'section_id' => $this->section->id,
            'name' => 'T1',
            'x_pos' => 0,
            'y_pos' => 0,
        ]);

        $this->token = $this->employee->createToken('test')->plainTextToken;
    }

    public function test_can_get_floor_layout(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/floor');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Main Dining')
            ->assertJsonPath('data.0.tables.0.name', 'T1');
    }

    public function test_can_open_table_session(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/floor/sessions', [
                'table_id' => $this->table->id,
                'guest_count' => 4,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.table_id', $this->table->id)
            ->assertJsonPath('data.guest_count', 4)
            ->assertJsonPath('data.status', 'ACTIVE');

        $this->assertDatabaseHas('table_sessions', [
            'table_id' => $this->table->id,
            'waiter_id' => $this->employee->id,
            'guest_count' => 4,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_cannot_open_session_on_occupied_table(): void
    {
        TableSession::create([
            'uuid' => (string) Str::uuid(),
            'table_id' => $this->table->id,
            'waiter_id' => $this->employee->id,
            'guest_count' => 2,
            'status' => 'ACTIVE',
            'opened_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/floor/sessions', [
                'table_id' => $this->table->id,
                'guest_count' => 4,
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['table_id']);
    }

    public function test_can_close_table_session(): void
    {
        $session = TableSession::create([
            'uuid' => (string) Str::uuid(),
            'table_id' => $this->table->id,
            'waiter_id' => $this->employee->id,
            'guest_count' => 2,
            'status' => 'ACTIVE',
            'opened_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/floor/sessions/{$session->uuid}/close");

        $response->assertOk()
            ->assertJsonPath('status', 'CLOSED');

        $this->assertDatabaseHas('table_sessions', [
            'id' => $session->id,
            'status' => 'CLOSED',
        ]);
    }

    public function test_floor_shows_active_sessions(): void
    {
        $session = TableSession::create([
            'uuid' => (string) Str::uuid(),
            'table_id' => $this->table->id,
            'waiter_id' => $this->employee->id,
            'guest_count' => 4,
            'status' => 'ACTIVE',
            'opened_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/floor');

        $response->assertOk()
            ->assertJsonPath('data.0.tables.0.active_session.uuid', $session->uuid)
            ->assertJsonPath('data.0.tables.0.active_session.guest_count', 4);
    }
}
