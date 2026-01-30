<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ModifierGroup;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'store_id',
        'category_id',
        'tax_group_id',
        'name',
        'description',
        'type',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'deleted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function modifierGroups()
    {
        return $this->belongsToMany(ModifierGroup::class, 'product_modifiers', 'product_id', 'modifier_group_id')
            ->withPivot('sort_order')
            ->orderBy('product_modifiers.sort_order');
    }

    public function taxGroup()
    {
        return $this->belongsTo(TaxGroup::class);
    }
}

