<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'store_id',
        'name',
        'phone',
        'email',
        'points_balance',
        'total_spend',
        'last_visit_at',
    ];

    protected function casts(): array
    {
        return [
            'total_spend' => 'integer',
            'last_visit_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
