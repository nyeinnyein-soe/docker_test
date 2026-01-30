<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use App\Models\TaxGroup;
use Illuminate\Http\Request;

class TaxGroupController extends Controller
{
    public function index(Request $request)
    {
        $taxGroups = TaxGroup::where('store_id', $request->user()->store_id)
            ->with('taxes')
            ->get();

        return response()->json(['data' => $taxGroups]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'taxes' => ['nullable', 'array'],
            'taxes.*.name' => ['required', 'string', 'max:50'],
            'taxes.*.rate' => ['required', 'numeric', 'min:0'],
            'taxes.*.is_inclusive' => ['required', 'boolean'],
            'taxes.*.priority' => ['integer'],
        ]);

        $taxGroup = TaxGroup::create([
            'store_id' => $request->user()->store_id,
            'name' => $data['name'],
        ]);

        if (! empty($data['taxes'])) {
            foreach ($data['taxes'] as $taxData) {
                $taxGroup->taxes()->create($taxData);
            }
        }

        return response()->json(['data' => $taxGroup->load('taxes')], 201);
    }

    public function update(Request $request, int $id)
    {
        $taxGroup = TaxGroup::where('store_id', $request->user()->store_id)->findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'taxes' => ['nullable', 'array'],
            'taxes.*.id' => ['nullable', 'integer'],
            'taxes.*.name' => ['required', 'string', 'max:50'],
            'taxes.*.rate' => ['required', 'numeric', 'min:0'],
            'taxes.*.is_inclusive' => ['required', 'boolean'],
            'taxes.*.priority' => ['integer'],
        ]);

        $taxGroup->update(['name' => $data['name']]);

        if (isset($data['taxes'])) {
            $taxIds = collect($data['taxes'])->pluck('id')->filter()->toArray();
            $taxGroup->taxes()->whereNotIn('id', $taxIds)->delete();

            foreach ($data['taxes'] as $taxData) {
                if (isset($taxData['id'])) {
                    $tax = $taxGroup->taxes()->find($taxData['id']);
                    if ($tax) {
                        $tax->update($taxData);
                    }
                } else {
                    $taxGroup->taxes()->create($taxData);
                }
            }
        }

        return response()->json(['data' => $taxGroup->load('taxes')]);
    }

    public function destroy(Request $request, int $id)
    {
        $taxGroup = TaxGroup::where('store_id', $request->user()->store_id)->findOrFail($id);
        
        // Check if any products use this tax group
        if ($taxGroup->products()->count() > 0) {
            return response()->json(['message' => 'Cannot delete tax group because it is assigned to products'], 422);
        }

        $taxGroup->taxes()->delete();
        $taxGroup->delete();

        return response()->json(null, 204);
    }
}
