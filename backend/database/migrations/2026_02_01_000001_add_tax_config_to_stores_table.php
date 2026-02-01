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
        Schema::table('stores', function (Blueprint $table) {
            $table->decimal('commercial_tax_rate', 5, 4)->default(0)->after('tax_registration_no');
            $table->boolean('commercial_tax_inclusive')->default(false)->after('commercial_tax_rate');
            $table->decimal('service_charge_rate', 5, 4)->default(0)->after('commercial_tax_inclusive');
            $table->boolean('service_charge_inclusive')->default(false)->after('service_charge_rate');
            $table->enum('default_tax_type', ['NONE', 'COMMERCIAL', 'SERVICE', 'BOTH'])->default('NONE')->after('service_charge_inclusive');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn([
                'commercial_tax_rate',
                'commercial_tax_inclusive',
                'service_charge_rate',
                'service_charge_inclusive',
                'default_tax_type',
            ]);
        });
    }
};
