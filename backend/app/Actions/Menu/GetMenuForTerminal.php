<?php

namespace App\Actions\Menu;

use App\Models\Store;
use App\Models\Terminal;

class GetMenuForTerminal
{
    public function __invoke(string $terminalUuid): array
    {
        /** @var Terminal $terminal */
        $terminal = Terminal::with('store')
            ->where('uuid', $terminalUuid)
            ->firstOrFail();

        /** @var Store $store */
        $store = $terminal->store;

        $categories = $store->categories()
            ->whereNull('deleted_at')
            ->get();

        $products = $store->products()
            ->whereNull('deleted_at')
            ->with(['variants' => function ($q) {
                $q->whereNull('deleted_at');
            }])
            ->get();

        $modifierGroups = $store->modifierGroups()
            ->with('modifiers')
            ->get();

        return [
            'store' => [
                'id' => $store->id,
                'uuid' => $store->uuid,
                'name' => $store->name,
                'currency_code' => $store->currency_code,
            ],
            'terminal' => [
                'id' => $terminal->id,
                'uuid' => $terminal->uuid,
                'name' => $terminal->name,
            ],
            'categories' => $categories,
            'products' => $products,
            'modifier_groups' => $modifierGroups,
        ];
    }
}

