<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modifier extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'name',
        'price_extra',
        'cost_extra',
    ];

    protected $casts = [
        'price_extra' => 'integer',
        'cost_extra' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function group()
    {
        return $this->belongsTo(ModifierGroup::class, 'group_id');
    }
}

