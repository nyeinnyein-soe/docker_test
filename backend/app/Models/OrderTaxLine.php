<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTaxLine extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'tax_name',
        'tax_rate',
        'tax_amount',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'tax_rate' => 'decimal:4',
            'tax_amount' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
