<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->json('tax_config_snapshot')->nullable()->after('tax_type');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('discount_amount', 15, 4)->default(0)->after('total_line_amount');
            $table->decimal('subtotal_after_discount', 15, 4)->default(0)->after('discount_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['discount_amount', 'subtotal_after_discount']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('tax_config_snapshot');
        });
    }
};
