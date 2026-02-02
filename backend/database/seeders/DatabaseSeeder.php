<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\FloorSection;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\Store;
use App\Models\Tax;
use App\Models\TaxGroup;
use App\Models\Terminal;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Store
        $store = Store::query()->firstOrCreate(
            ['name' => 'Demo Store'],
            [
                'uuid' => (string) Str::uuid(),
                'currency_code' => 'MMK',
                'time_zone' => 'Asia/Yangon',
                'tax_registration_no' => null,
                'is_active' => true,
            ]
        );

        // Create Roles
        $managerRole = Role::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Manager'],
            [
                'permissions' => [
                    'void_order',
                    'refund_payment',
                    'view_reports',
                    'manage_menu',
                    'manage_employees',
                ],
            ]
        );

        $cashierRole = Role::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Cashier'],
            [
                'permissions' => [
                    'create_order',
                    'process_payment',
                ],
            ]
        );

        $waiterRole = Role::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Waiter'],
            [
                'permissions' => [
                    'create_order',
                    'manage_tables',
                ],
            ]
        );

        $kitchenRole = Role::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Kitchen'],
            [
                'permissions' => [
                    'view_orders',
                    'update_kitchen_status',
                ],
            ]
        );

        // Create Employees
        Employee::query()->firstOrCreate(
            ['email' => 'manager@example.com', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'role_id' => $managerRole->id,
                'first_name' => 'Demo',
                'last_name' => 'Manager',
                'pin_hash' => Hash::make('1234'),
                'is_active' => true,
            ]
        );

        Employee::query()->firstOrCreate(
            ['email' => 'cashier@example.com', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'role_id' => $cashierRole->id,
                'first_name' => 'John',
                'last_name' => 'Cashier',
                'pin_hash' => Hash::make('1234'),
                'is_active' => true,
            ]
        );

        Employee::query()->firstOrCreate(
            ['email' => 'waiter@example.com', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'role_id' => $waiterRole->id,
                'first_name' => 'Sarah',
                'last_name' => 'Waiter',
                'pin_hash' => Hash::make('1234'),
                'is_active' => true,
            ]
        );

        Employee::query()->firstOrCreate(
            ['email' => 'kitchen@example.com', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'role_id' => $kitchenRole->id,
                'first_name' => 'Mike',
                'last_name' => 'Chef',
                'pin_hash' => Hash::make('1234'),
                'is_active' => true,
            ]
        );

        // Create Terminals
        Terminal::query()->firstOrCreate(
            ['name' => 'Front Counter 1', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'device_token' => null,
                'is_active' => true,
            ]
        );

        Terminal::query()->firstOrCreate(
            ['name' => 'Drive Through', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'device_token' => null,
                'is_active' => true,
            ]
        );

        Terminal::query()->firstOrCreate(
            ['name' => 'Kitchen Display', 'store_id' => $store->id],
            [
                'uuid' => (string) Str::uuid(),
                'device_token' => null,
                'is_active' => true,
            ]
        );

        // Create Tax Groups
        $standardTaxGroup = TaxGroup::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Standard Tax'],
            []
        );

        Tax::query()->firstOrCreate(
            ['tax_group_id' => $standardTaxGroup->id, 'name' => 'VAT 5%'],
            [
                'rate' => 0.05,
                'is_inclusive' => false,
                'priority' => 1,
            ]
        );

        $serviceChargeGroup = TaxGroup::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Service Charge'],
            []
        );

        Tax::query()->firstOrCreate(
            ['tax_group_id' => $serviceChargeGroup->id, 'name' => 'Service Charge 10%'],
            [
                'rate' => 0.10,
                'is_inclusive' => false,
                'priority' => 2,
            ]
        );

        // Create Categories
        $hotDrinks = Category::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Hot Drinks'],
            [
                'color_hex' => '#F97316',
                'printer_destination' => 'KITCHEN',
            ]
        );

        $coldDrinks = Category::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Cold Drinks'],
            [
                'color_hex' => '#3B82F6',
                'printer_destination' => 'KITCHEN',
            ]
        );

        $food = Category::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Food'],
            [
                'color_hex' => '#10B981',
                'printer_destination' => 'KITCHEN',
            ]
        );

        $desserts = Category::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Desserts'],
            [
                'color_hex' => '#EC4899',
                'printer_destination' => 'KITCHEN',
            ]
        );

        $snacks = Category::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Snacks'],
            [
                'color_hex' => '#F59E0B',
                'printer_destination' => 'KITCHEN',
            ]
        );

        // Create Modifier Groups
        $milkGroup = ModifierGroup::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Milk'],
            [
                'min_select' => 0,
                'max_select' => 1,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $milkGroup->id, 'name' => 'Whole Milk'],
            [
                'price_extra' => 0.00,
                'cost_extra' => 0.00,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $milkGroup->id, 'name' => 'Oat Milk'],
            [
                'price_extra' => 500,
                'cost_extra' => 200,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $milkGroup->id, 'name' => 'Almond Milk'],
            [
                'price_extra' => 500,
                'cost_extra' => 200,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $milkGroup->id, 'name' => 'Soy Milk'],
            [
                'price_extra' => 500,
                'cost_extra' => 200,
            ]
        );

        $sizeGroup = ModifierGroup::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Size'],
            [
                'min_select' => 1,
                'max_select' => 1,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $sizeGroup->id, 'name' => 'Small'],
            [
                'price_extra' => 0.00,
                'cost_extra' => 0.00,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $sizeGroup->id, 'name' => 'Medium'],
            [
                'price_extra' => 1000,
                'cost_extra' => 300,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $sizeGroup->id, 'name' => 'Large'],
            [
                'price_extra' => 2000,
                'cost_extra' => 600,
            ]
        );

        $toppingsGroup = ModifierGroup::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Toppings'],
            [
                'min_select' => 0,
                'max_select' => 5,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $toppingsGroup->id, 'name' => 'Extra Cheese'],
            [
                'price_extra' => 1500,
                'cost_extra' => 500,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $toppingsGroup->id, 'name' => 'Bacon'],
            [
                'price_extra' => 2000,
                'cost_extra' => 1000,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $toppingsGroup->id, 'name' => 'Mushrooms'],
            [
                'price_extra' => 1000,
                'cost_extra' => 300,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $toppingsGroup->id, 'name' => 'Onions'],
            [
                'price_extra' => 500,
                'cost_extra' => 100,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $toppingsGroup->id, 'name' => 'Pickles'],
            [
                'price_extra' => 500,
                'cost_extra' => 100,
            ]
        );

        $extrasGroup = ModifierGroup::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Extras'],
            [
                'min_select' => 0,
                'max_select' => 3,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $extrasGroup->id, 'name' => 'Extra Shot'],
            [
                'price_extra' => 1000,
                'cost_extra' => 300,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $extrasGroup->id, 'name' => 'Whipped Cream'],
            [
                'price_extra' => 750,
                'cost_extra' => 200,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $extrasGroup->id, 'name' => 'Caramel Syrup'],
            [
                'price_extra' => 500,
                'cost_extra' => 150,
            ]
        );

        Modifier::query()->firstOrCreate(
            ['group_id' => $extrasGroup->id, 'name' => 'Chocolate Syrup'],
            [
                'price_extra' => 500,
                'cost_extra' => 150,
            ]
        );

        // Create Products - Hot Drinks
        $coffee = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Coffee'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $hotDrinks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Fresh brewed coffee',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $coffee->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'COF-SM',
                'price' => 3500,
                'cost' => 1000,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $coffee->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'COF-LG',
                'price' => 4500,
                'cost' => 1300,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        // Attach modifier groups to coffee
        $coffee->modifierGroups()->sync([
            $milkGroup->id => ['sort_order' => 0],
            $sizeGroup->id => ['sort_order' => 1],
            $extrasGroup->id => ['sort_order' => 2],
        ]);

        $tea = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Tea'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $hotDrinks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Hot tea',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $tea->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'TEA-SM',
                'price' => 2500,
                'cost' => 500,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $tea->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'TEA-LG',
                'price' => 3500,
                'cost' => 700,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $tea->modifierGroups()->sync([
            $milkGroup->id => ['sort_order' => 0],
            $sizeGroup->id => ['sort_order' => 1],
        ]);

        $latte = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Latte'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $hotDrinks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Espresso with steamed milk',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $latte->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'LAT-SM',
                'price' => 4500,
                'cost' => 1200,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $latte->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'LAT-LG',
                'price' => 5500,
                'cost' => 1500,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $latte->modifierGroups()->sync([
            $milkGroup->id => ['sort_order' => 0],
            $sizeGroup->id => ['sort_order' => 1],
            $extrasGroup->id => ['sort_order' => 2],
        ]);

        // Create Products - Cold Drinks
        $milkShake = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Milk Shake'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $coldDrinks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Creamy milkshake',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $milkShake->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'MS-SM',
                'price' => 5000,
                'cost' => 1500,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $milkShake->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'MS-LG',
                'price' => 6500,
                'cost' => 2000,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $milkShake->modifierGroups()->sync([
            $sizeGroup->id => ['sort_order' => 0],
            $extrasGroup->id => ['sort_order' => 1],
        ]);

        $smoothie = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Smoothie'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $coldDrinks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Fresh fruit smoothie',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $smoothie->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'SM-SM',
                'price' => 6000,
                'cost' => 2000,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $smoothie->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'SM-LG',
                'price' => 7500,
                'cost' => 2500,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $smoothie->modifierGroups()->sync([
            $sizeGroup->id => ['sort_order' => 0],
        ]);

        // Create Products - Food
        $burger = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Burger'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $food->id,
                'tax_group_id' => $serviceChargeGroup->id,
                'description' => 'Classic beef burger',
                'type' => 'SIMPLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $burger->id, 'name' => 'Default'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'BUR-001',
                'price' => 8500,
                'cost' => 3000,
                'is_default' => true,
            ]
        );

        $burger->modifierGroups()->sync([
            $toppingsGroup->id => ['sort_order' => 0],
        ]);

        $pizza = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Pizza'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $food->id,
                'tax_group_id' => $serviceChargeGroup->id,
                'description' => 'Wood-fired pizza',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $pizza->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'PIZ-SM',
                'price' => 12000,
                'cost' => 4000,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $pizza->id, 'name' => 'Medium'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'PIZ-MD',
                'price' => 16000,
                'cost' => 5500,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $pizza->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'PIZ-LG',
                'price' => 20000,
                'cost' => 7000,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $pizza->modifierGroups()->sync([
            $toppingsGroup->id => ['sort_order' => 0],
        ]);

        $pasta = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Pasta'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $food->id,
                'tax_group_id' => $serviceChargeGroup->id,
                'description' => 'Italian pasta',
                'type' => 'SIMPLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $pasta->id, 'name' => 'Default'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'PAS-001',
                'price' => 10000,
                'cost' => 3500,
                'is_default' => true,
            ]
        );

        // Create Products - Desserts
        $cake = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Cake Slice'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $desserts->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Fresh cake slice',
                'type' => 'SIMPLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $cake->id, 'name' => 'Default'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'CAK-001',
                'price' => 4500,
                'cost' => 1500,
                'is_default' => true,
            ]
        );

        $iceCream = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Ice Cream'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $desserts->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Premium ice cream',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $iceCream->id, 'name' => 'Single Scoop'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'ICE-1',
                'price' => 3000,
                'cost' => 1000,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $iceCream->id, 'name' => 'Double Scoop'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'ICE-2',
                'price' => 5000,
                'cost' => 1800,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $iceCream->modifierGroups()->sync([
            $extrasGroup->id => ['sort_order' => 0],
        ]);

        // Create Products - Snacks
        $fries = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'French Fries'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $snacks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Crispy french fries',
                'type' => 'VARIABLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $fries->id, 'name' => 'Small'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'FRI-SM',
                'price' => 3000,
                'cost' => 800,
                'is_default' => true,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $fries->id, 'name' => 'Large'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'FRI-LG',
                'price' => 4500,
                'cost' => 1200,
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $chips = Product::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Chips'],
            [
                'uuid' => (string) Str::uuid(),
                'category_id' => $snacks->id,
                'tax_group_id' => $standardTaxGroup->id,
                'description' => 'Potato chips',
                'type' => 'SIMPLE',
                'image_url' => null,
                'is_active' => true,
            ]
        );

        ProductVariant::query()->firstOrCreate(
            ['product_id' => $chips->id, 'name' => 'Default'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'CHP-001',
                'price' => 2500,
                'cost' => 600,
                'is_default' => true,
            ]
        );

        // Create Floor Sections and Tables (for restaurant mode)
        $mainFloor = FloorSection::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Main Floor'],
            []
        );

        $outdoorFloor = FloorSection::query()->firstOrCreate(
            ['store_id' => $store->id, 'name' => 'Outdoor'],
            []
        );

        // Create Tables
        for ($i = 1; $i <= 8; $i++) {
            DiningTable::query()->firstOrCreate(
                ['section_id' => $mainFloor->id, 'name' => "Table $i"],
                [
                    'capacity' => ($i <= 4) ? 4 : 2,
                    'x_pos' => (($i - 1) % 4) * 150 + 50,
                    'y_pos' => (intval(($i - 1) / 4)) * 150 + 50,
                ]
            );
        }

        for ($i = 1; $i <= 4; $i++) {
            DiningTable::query()->firstOrCreate(
                ['section_id' => $outdoorFloor->id, 'name' => "Outdoor $i"],
                [
                    'capacity' => 4,
                    'x_pos' => (($i - 1) % 2) * 200 + 50,
                    'y_pos' => (intval(($i - 1) / 2)) * 200 + 50,
                ]
            );
        }

        // Create Sample Customers
        Customer::query()->firstOrCreate(
            ['store_id' => $store->id, 'email' => 'customer1@example.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'John Doe',
                'phone' => '+959123456789',
                'points_balance' => 0,
                'total_spend' => 0.00,
            ]
        );

        Customer::query()->firstOrCreate(
            ['store_id' => $store->id, 'email' => 'customer2@example.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Jane Smith',
                'phone' => '+959987654321',
                'points_balance' => 150,
                'total_spend' => 250.00,
            ]
        );

        Customer::query()->firstOrCreate(
            ['store_id' => $store->id, 'email' => 'customer3@example.com'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Bob Johnson',
                'phone' => '+959555123456',
                'points_balance' => 50,
                'total_spend' => 100.00,
            ]
        );
    }
}
