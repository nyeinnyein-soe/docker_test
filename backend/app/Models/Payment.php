<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'store_id',
        'order_id',
        'shift_id',
        'terminal_id',
        'type',
        'method',
        'status',
        'amount',
        'tip_amount',
        'external_ref',
        'parent_payment_id',
    ];

    protected $casts = [
        'amount' => 'integer',
        'tip_amount' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function terminal()
    {
        return $this->belongsTo(Terminal::class);
    }
}

