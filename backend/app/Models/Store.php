<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'name',
        'currency_code',
        'time_zone',
        'tax_registration_no',
        'is_active',
        'pos_mode',
        'setup_complete',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'setup_complete' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function terminals()
    {
        return $this->hasMany(Terminal::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function modifierGroups()
    {
        return $this->hasMany(ModifierGroup::class);
    }

    public function floorSections()
    {
        return $this->hasMany(FloorSection::class);
    }

    public function taxGroups()
    {
        return $this->hasMany(TaxGroup::class);
    }

    public function discounts()
    {
        return $this->hasMany(Discount::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
}

