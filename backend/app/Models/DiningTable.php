<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiningTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'section_id',
        'name',
        'x_pos',
        'y_pos',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function section()
    {
        return $this->belongsTo(FloorSection::class, 'section_id');
    }

    public function sessions()
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }

    public function activeSession()
    {
        return $this->hasOne(TableSession::class, 'table_id')
            ->where('status', 'ACTIVE')
            ->orWhere('status', 'PAYING');
    }
}
