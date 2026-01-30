<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLevel extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'store_id',
        'variant_id',
        'quantity_on_hand',
        'quantity_committed',
        'low_stock_threshold',
        'version',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_on_hand' => 'decimal:4',
            'quantity_committed' => 'decimal:4',
            'low_stock_threshold' => 'decimal:4',
            'updated_at' => 'datetime',
        ];
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
