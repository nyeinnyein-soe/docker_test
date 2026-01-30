<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Stores
        Schema::create('stores', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->string('name', 100);
            $table->string('currency_code', 3)->default('USD');
            $table->string('time_zone', 50)->default('UTC');
            $table->string('tax_registration_no', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // 2. Terminals
        Schema::create('terminals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 50);
            $table->string('device_token', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // 3. Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 50);
            $table->json('permissions')->nullable();
            $table->timestampsTz();
        });

        // 4. Employees
        Schema::create('employees', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('role_id')->constrained('roles');
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('pin_hash', 255);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('deleted_at')->nullable();
            $table->timestampsTz();
        });

        // 5. Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 150)->nullable();
            $table->integer('points_balance')->default(0);
            $table->decimal('total_spend', 12, 2)->default(0);
            $table->timestampTz('last_visit_at')->nullable();
            $table->timestampsTz();
            $table->index('phone');
        });

        // 6. Tax groups
        Schema::create('tax_groups', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 50);
            $table->timestampsTz();
        });

        // 7. Taxes
        Schema::create('taxes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('tax_group_id')->constrained('tax_groups');
            $table->string('name', 50);
            $table->decimal('rate', 10, 4);
            $table->boolean('is_inclusive')->default(false);
            $table->integer('priority')->default(0);
            $table->timestampsTz();
        });

        // 8. Discounts
        Schema::create('discounts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 100);
            $table->enum('type', ['PERCENTAGE', 'FIXED_AMOUNT']);
            $table->decimal('value', 12, 2);
            $table->timestampTz('start_date')->nullable();
            $table->timestampTz('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // 9. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 100);
            $table->string('color_hex', 7)->default('#CCCCCC');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->enum('printer_destination', ['KITCHEN', 'BAR', 'NONE'])->default('KITCHEN');
            $table->timestampTz('deleted_at')->nullable();
            $table->timestampsTz();
        });

        // 10. Products
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('category_id')->nullable()->constrained('categories');
            $table->foreignId('tax_group_id')->nullable()->constrained('tax_groups');
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->enum('type', ['SIMPLE', 'VARIABLE', 'COMBO'])->default('SIMPLE');
            $table->string('image_url', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('deleted_at')->nullable();
            $table->timestampsTz();
        });

        // 11. Product variants
        Schema::create('product_variants', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('product_id')->constrained('products');
            $table->string('name', 100);
            $table->string('sku', 50)->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('cost', 12, 2)->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestampTz('deleted_at')->nullable();
            $table->timestampsTz();
            $table->index('sku');
        });

        // 12. Modifier groups
        Schema::create('modifier_groups', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 100);
            $table->integer('min_select')->default(0);
            $table->integer('max_select')->default(1);
            $table->timestampsTz();
        });

        // 13. Modifiers
        Schema::create('modifiers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('group_id')->constrained('modifier_groups');
            $table->string('name', 100);
            $table->decimal('price_extra', 12, 2)->default(0);
            $table->decimal('cost_extra', 12, 2)->default(0);
            $table->timestampsTz();
        });

        // 14. Product modifiers pivot
        Schema::create('product_modifiers', function (Blueprint $table) {
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('modifier_group_id')->constrained('modifier_groups');
            $table->integer('sort_order')->default(0);
            $table->primary(['product_id', 'modifier_group_id']);
        });

        // 15. Inventory levels
        Schema::create('inventory_levels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('variant_id')->constrained('product_variants');
            $table->decimal('quantity_on_hand', 15, 4)->default(0);
            $table->decimal('quantity_committed', 15, 4)->default(0);
            $table->decimal('low_stock_threshold', 15, 4)->default(5);
            $table->integer('version')->default(1);
            $table->timestampTz('updated_at')->useCurrent();
            $table->unique(['store_id', 'variant_id']);
        });

        // 16. Inventory transactions
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('variant_id')->constrained('product_variants');
            $table->foreignId('employee_id')->nullable()->constrained('employees');
            $table->enum('type', ['SALE', 'RECEIVE', 'WASTE', 'COUNT', 'RETURN', 'VOID_RETURN']);
            $table->decimal('quantity_change', 15, 4);
            $table->decimal('cost_at_time', 12, 2);
            $table->enum('reference_type', ['ORDER', 'PO', 'ADJUSTMENT']);
            $table->uuid('reference_uuid')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        // 17. Floor sections
        Schema::create('floor_sections', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->string('name', 50);
            $table->timestampsTz();
        });

        // 18. Dining tables
        Schema::create('dining_tables', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('section_id')->constrained('floor_sections');
            $table->string('name', 20);
            $table->integer('x_pos')->default(0);
            $table->integer('y_pos')->default(0);
            $table->timestampsTz();
        });

        // 19. Table sessions
        Schema::create('table_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('table_id')->constrained('dining_tables');
            $table->foreignId('waiter_id')->nullable()->constrained('employees');
            $table->integer('guest_count')->default(1);
            $table->enum('status', ['ACTIVE', 'PAYING', 'CLOSED'])->default('ACTIVE');
            $table->timestampTz('opened_at')->useCurrent();
            $table->timestampTz('closed_at')->nullable();
            $table->timestampsTz();
        });

        // 20. Shifts
        Schema::create('shifts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('employee_id')->constrained('employees');
            $table->foreignId('terminal_id')->constrained('terminals');
            $table->timestampTz('start_time')->useCurrent();
            $table->timestampTz('end_time')->nullable();
            $table->decimal('starting_cash', 12, 2);
            $table->decimal('expected_cash', 12, 2)->default(0);
            $table->decimal('actual_cash', 12, 2)->default(0);
            $table->decimal('difference', 12, 2)->default(0);
            $table->enum('status', ['OPEN', 'CLOSED'])->default('OPEN');
            $table->timestampsTz();
        });

        // 21. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('shift_id')->constrained('shifts');
            $table->foreignId('table_session_id')->nullable()->constrained('table_sessions');
            $table->foreignId('employee_id')->constrained('employees');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->string('order_number', 50);
            $table->enum('type', ['DINE_IN', 'TAKE_OUT', 'DELIVERY']);
            $table->enum('status', ['OPEN', 'CONFIRMED', 'COMPLETED', 'VOIDED', 'REFUNDED'])->default('OPEN');
            $table->enum('payment_status', ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID'])->default('UNPAID');
            $table->integer('version')->default(1);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('total_tax', 12, 2)->default(0);
            $table->decimal('total_discount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->timestampsTz();
        });

        // 22. Order items
        Schema::create('order_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('variant_id')->constrained('product_variants');
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('total_line_amount', 12, 2);
            $table->enum('kitchen_status', ['PENDING', 'SENT', 'COOKING', 'SERVED'])->default('PENDING');
            $table->boolean('is_voided')->default(false);
            $table->integer('void_reason_id')->nullable();
            $table->timestampsTz();
        });

        // 23. Order item modifiers
        Schema::create('order_item_modifiers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_item_id')->constrained('order_items');
            $table->foreignId('modifier_id')->constrained('modifiers');
            $table->decimal('price_charged', 12, 2);
            $table->decimal('cost_charged', 12, 2);
            $table->timestampTz('created_at')->useCurrent();
        });

        // 24. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('order_id')->constrained('orders');
            $table->foreignId('shift_id')->constrained('shifts');
            $table->foreignId('terminal_id')->constrained('terminals');
            $table->enum('type', ['PAYMENT', 'REFUND']);
            $table->enum('method', ['CASH', 'CARD', 'QR', 'LOYALTY', 'OTHER']);
            $table->enum('status', ['PENDING', 'SUCCESS', 'FAILED', 'VOIDED'])->default('PENDING');
            $table->decimal('amount', 12, 2);
            $table->decimal('tip_amount', 12, 2)->default(0);
            $table->string('external_ref', 100)->nullable();
            $table->unsignedBigInteger('parent_payment_id')->nullable();
            $table->timestampsTz();
        });

        // 25. Order tax lines
        Schema::create('order_tax_lines', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders');
            $table->string('tax_name', 50);
            $table->decimal('tax_rate', 10, 4);
            $table->decimal('tax_amount', 12, 2);
            $table->timestampTz('created_at')->useCurrent();
        });

        // 26. Order discounts
        Schema::create('order_discounts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders');
            $table->string('name', 100);
            $table->decimal('amount', 12, 2);
            $table->foreignId('applied_by_employee_id')->nullable()->constrained('employees');
            $table->timestampTz('created_at')->useCurrent();
        });

        // 27. Audit logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('employee_id')->constrained('employees');
            $table->string('event_type', 50);
            $table->string('table_name', 50)->nullable();
            $table->unsignedBigInteger('record_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->text('description')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('order_discounts');
        Schema::dropIfExists('order_tax_lines');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_item_modifiers');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('table_sessions');
        Schema::dropIfExists('dining_tables');
        Schema::dropIfExists('floor_sections');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_levels');
        Schema::dropIfExists('product_modifiers');
        Schema::dropIfExists('modifiers');
        Schema::dropIfExists('modifier_groups');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('taxes');
        Schema::dropIfExists('tax_groups');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('terminals');
        Schema::dropIfExists('stores');
    }
};

