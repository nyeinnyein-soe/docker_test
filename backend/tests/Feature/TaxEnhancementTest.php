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

class TaxEnhancementTest extends TestCase
{
    use RefreshDatabase;

    protected Store $store;
    protected Terminal $terminal;
    protected Employee $employee;
    protected Shift $shift;
    protected ProductVariant $variant1;
    protected ProductVariant $variant2;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Tax Test Store',
            'currency_code' => 'USD',
            'time_zone' => 'UTC',
            'is_active' => true,
            'commercial_tax_rate' => 0.05,
            'commercial_tax_inclusive' => false,
            'service_charge_rate' => 0.10,
            'service_charge_inclusive' => false,
            'default_tax_type' => 'COMMERCIAL',
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
        ]);

        $this->employee = Employee::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'role_id' => $role->id,
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'tax@example.com',
            'pin_hash' => Hash::make('1234'),
            'is_active' => true,
        ]);

        $this->shift = Shift::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'employee_id' => $this->employee->id,
            'terminal_id' => $this->terminal->id,
            'starting_cash' => 100.00,
            'status' => 'OPEN',
        ]);

        $category = Category::create([
            'store_id' => $this->store->id,
            'name' => 'Food',
        ]);

        $product1 = Product::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'category_id' => $category->id,
            'name' => 'Pizza',
            'is_taxable' => true,
        ]);

        // Pizza Variant
        $this->variant1 = ProductVariant::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $product1->id,
            'name' => 'Pizza',
            'sku' => 'PIZ-001',
            'price' => 10000,
            'cost' => 4000,
            'is_default' => true,
        ]);

        $product2 = Product::create([
            'uuid' => (string) Str::uuid(),
            'store_id' => $this->store->id,
            'category_id' => $category->id,
            'name' => 'Soda',
            'is_taxable' => true,
        ]);

        // Drink Variant
        $this->variant2 = ProductVariant::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $product2->id,
            'name' => 'Cola',
            'sku' => 'COL-001',
            'price' => 2000,
            'cost' => 500,
            'is_default' => true,
        ]);

        $this->token = $this->employee->createToken('test')->plainTextToken;
    }

    public function test_order_captures_tax_snapshot_and_persists_even_after_store_change(): void
    {
        // 1. Create order with BOTH taxes enabled via the default or explicit
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/orders', [
                'shift_id' => $this->shift->id,
                'type' => 'DINE_IN',
                'tax_type' => 'BOTH', // Explicitly test both
                'items' => [['variant_id' => $this->variant1->id, 'quantity' => 1]],
            ]);

        $response->assertCreated();
        $orderUuid = $response->json('data.uuid');
        // Initial Check: Should be 10,000 + 500 (Commercial 5%) + 1000 (Service 10%) = 11,500
        $this->assertDatabaseHas('orders', [
            'uuid' => $orderUuid,
            'subtotal' => 10000,
            'total_tax' => 1500, // 500 + 1000
            'grand_total' => 11500,
        ]);

        // 3. Change store tax rates
        $this->store->update([
            'commercial_tax_rate' => 0.10, // 10%
            'service_charge_rate' => 0.10, // 10%
        ]);

        // 4. Update Tax on existing order (should now refresh snapshot from store)
        // Store now has 10% Commercial + 10% Service
        // Snapshot should be updated to 10% Commercial + 10% Service
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/orders/{$orderUuid}/tax", [
                'tax_type' => 'BOTH',
            ]);

        $response->assertOk();

        // Totals should be updated: 10,000 + 1000 (Comm 10%) + 1000 (Srv 10%) = 12,000
        $this->assertDatabaseHas('orders', [
            'uuid' => $orderUuid,
            'subtotal' => 10000,
            'total_tax' => 2000,
            'grand_total' => 12000,
        ]);
        $this->assertEquals(0.10, (float) $response->json('data.tax_config_snapshot.commercial_tax_rate'));
    }

    /**
     * Test that order-level discounts are distributed proportionally to items.
     */
    public function test_order_distributes_discount_proportionally_to_items(): void
    {
        // 1. Create order with 2 items (10,000 and 2,000 = 12,000 total)
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/orders', [
                'shift_id' => $this->shift->id,
                'type' => 'DINE_IN',
                'tax_type' => 'COMMERCIAL',
                'order_number' => 'DISC-001',
                'manual_discount' => [
                    'name' => 'Test Discount',
                    'type' => 'FIXED_AMOUNT',
                    'value' => 3000, // 3,000 discount
                ],
                'items' => [
                    [
                        'variant_id' => $this->variant1->id,
                        'quantity' => 1, // Price 10,000
                    ],
                    [
                        'variant_id' => $this->variant2->id,
                        'quantity' => 1, // Price 2,000
                    ],
                ],
            ]);

        $response->assertCreated();
        $orderId = $response->json('data.id');

        // Check Item 1 (10,000)
        // Proportion: 10,000/12,000 * 3,000 = 2,500
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'variant_id' => $this->variant1->id,
            'total_line_amount' => 10000,
            'discount_amount' => 2500,
            'subtotal_after_discount' => 7500,
        ]);

        // Check Item 2 (2,000)
        // Proportion: 2,000/12,000 * 3,000 = 500
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'variant_id' => $this->variant2->id,
            'total_line_amount' => 2000,
            'discount_amount' => 500,
            'subtotal_after_discount' => 1500,
        ]);

        // Check Order totals
        // Subtotal after discount = 9,000
        // Tax = 5% of 9,000 = 450
        // Grand Total = 9,450
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'subtotal' => 12000,
            'total_tax' => 450,
            'total_discount' => 3000,
            'grand_total' => 9450,
        ]);
    }
}
