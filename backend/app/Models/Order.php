<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'store_id',
        'shift_id',
        'table_session_id',
        'employee_id',
        'customer_id',
        'order_number',
        'type',
        'status',
        'payment_status',
        'version',
        'subtotal',
        'total_tax',
        'total_discount',
        'grand_total',
        'total_paid',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total_tax' => 'decimal:2',
            'total_discount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function taxLines()
    {
        return $this->hasMany(OrderTaxLine::class);
    }

    public function discounts()
    {
        return $this->hasMany(OrderDiscount::class);
    }

    public function tableSession()
    {
        return $this->belongsTo(TableSession::class, 'table_session_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}

