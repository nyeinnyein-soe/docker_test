<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'store_id',
        'variant_id',
        'employee_id',
        'type',
        'quantity_change',
        'cost_at_time',
        'reference_type',
        'reference_uuid',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_change' => 'decimal:4',
            'cost_at_time' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
