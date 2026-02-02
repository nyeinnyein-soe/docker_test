<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\Shift;
use App\Models\Store;
use App\Models\Terminal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected Store $store;
    protected Terminal $terminal;
    protected Employee $employee;
    protected Shift $shift;
    protected ProductVariant $variant;
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

        $this->shift = Shift::create([
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

        $category = Category::create([
            'store_id' => $this->store->id,
            'name' => 'Drinks',
            'color_hex' => '#FF0000',
            'printer_destination' => 'KITCHEN',
        ]);

        $product = Product::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'category_id' => $category->id,
            'name' => 'Coffee',
            'type' => 'SIMPLE',
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $product->id,
            'name' => 'Regular',
            'sku' => 'COF-REG',
            'price' => 3.50,
            'cost' => 1.00,
        ]);

        $this->token = $this->employee->createToken('test')->plainTextToken;
    }

    public function test_can_create_takeout_order(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/orders', [
                'shift_id' => $this->shift->id,
                'type' => 'TAKE_OUT',
                'items' => [
                    ['variant_id' => $this->variant->id, 'quantity' => 2],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.type', 'TAKE_OUT')
            ->assertJsonPath('data.status', 'OPEN')
            ->assertJsonPath('data.payment_status', 'UNPAID')
            ->assertJsonPath('data.subtotal', 6)
            ->assertJsonPath('data.grand_total', 6);

        $this->assertDatabaseHas('orders', [
            'store_id' => $this->store->id,
            'type' => 'TAKE_OUT',
            'status' => 'OPEN',
            'subtotal' => 6,
            'grand_total' => 6,
        ]);

        $this->assertDatabaseHas('order_items', [
            'variant_id' => $this->variant->id,
            'quantity' => 2,
            'unit_price' => 3,
            'total_line_amount' => 6,
        ]);
    }

    public function test_can_confirm_order(): void
    {
        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'shift_id' => $this->shift->id,
            'employee_id' => $this->employee->id,
            'order_number' => '001',
            'type' => 'TAKE_OUT',
            'status' => 'OPEN',
            'payment_status' => 'UNPAID',
            'version' => 1,
            'subtotal' => 7,
            'total_tax' => 0,
            'total_discount' => 0,
            'grand_total' => 7,
            'total_paid' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/orders/{$order->uuid}/confirm");

        $response->assertOk()
            ->assertJsonPath('data.status', 'CONFIRMED');
    }

    public function test_can_pay_order(): void
    {
        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'shift_id' => $this->shift->id,
            'employee_id' => $this->employee->id,
            'order_number' => '001',
            'type' => 'TAKE_OUT',
            'status' => 'OPEN',
            'payment_status' => 'UNPAID',
            'version' => 1,
            'subtotal' => 7,
            'total_tax' => 0,
            'total_discount' => 0,
            'grand_total' => 7,
            'total_paid' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/orders/{$order->uuid}/pay", [
                'shift_id' => $this->shift->id,
                'terminal_uuid' => $this->terminal->uuid,
                'method' => 'CASH',
                'amount' => 7,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.payment_status', 'PAID')
            ->assertJsonPath('data.status', 'COMPLETED')
            ->assertJsonPath('data.total_paid', 7);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'CASH',
            'amount' => 7.00,
            'status' => 'SUCCESS',
        ]);
    }

    public function test_can_void_unpaid_order(): void
    {
        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'shift_id' => $this->shift->id,
            'employee_id' => $this->employee->id,
            'order_number' => '001',
            'type' => 'TAKE_OUT',
            'status' => 'OPEN',
            'payment_status' => 'UNPAID',
            'version' => 1,
            'subtotal' => 7.00,
            'total_tax' => 0,
            'total_discount' => 0,
            'grand_total' => 7.00,
            'total_paid' => 0,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/orders/{$order->uuid}/void", [
                'reason' => 'Customer cancelled',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'VOIDED');
    }

    public function test_cannot_void_paid_order(): void
    {
        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'shift_id' => $this->shift->id,
            'employee_id' => $this->employee->id,
            'order_number' => '001',
            'type' => 'TAKE_OUT',
            'status' => 'COMPLETED',
            'payment_status' => 'PAID',
            'version' => 1,
            'subtotal' => 7.00,
            'total_tax' => 0,
            'total_discount' => 0,
            'grand_total' => 7.00,
            'total_paid' => 7.00,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/orders/{$order->uuid}/void");

        $response->assertUnprocessable();
    }
}
