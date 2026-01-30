<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'order_id',
        'variant_id',
        'quantity',
        'unit_price',
        'unit_cost',
        'total_line_amount',
        'kitchen_status',
        'is_voided',
        'void_reason_id',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'total_line_amount' => 'decimal:2',
            'is_voided' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function modifiers()
    {
        return $this->hasMany(OrderItemModifier::class);
    }
}

