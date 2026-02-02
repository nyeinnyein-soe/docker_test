<?php

namespace App\Actions\Floor;

use App\Models\FloorSection;
use Illuminate\Support\Str;

class GetFloorLayout
{
    public function __invoke(int $storeId): array
    {
        $sections = FloorSection::where('store_id', $storeId)
            ->with([
                'tables' => function ($query) {
                    $query->with([
                        'activeSession' => function ($q) {
                            $q->whereIn('status', ['ACTIVE', 'PAYING']);
                        }
                    ]);
                }
            ])
            ->get();

        // Transform sections to floors format expected by frontend
        $floors = $sections->map(function ($section) {
            return [
                'id' => $section->id,
                'uuid' => (string) Str::uuid(), // Generate UUID for frontend compatibility
                'store_id' => $section->store_id,
                'name' => $section->name,
                'tables' => $section->tables->map(function ($table) use ($section) {
                    // Determine table status based on active session
                    $status = 'AVAILABLE';
                    if ($table->activeSession) {
                        $status = 'OCCUPIED';
                    }

                    // Get order statistics for active session
                    $orderCount = 0;
                    $orderTotal = 0;
                    if ($table->activeSession) {
                        $orders = $table->activeSession->orders()
                            ->where('payment_status', '!=', 'PAID')
                            ->get();
                        $orderCount = $orders->count();
                        $orderTotal = $orders->sum('grand_total');
                    }

                    return [
                        'id' => $table->id,
                        'uuid' => (string) Str::uuid(), // Generate UUID for frontend compatibility
                        'section_id' => $section->id, // Match frontend expected section_id
                        'name' => $table->name,
                        'capacity' => $table->capacity, // Use actual capacity from DB
                        'x_pos' => $table->x_pos,
                        'y_pos' => $table->y_pos,
                        'width' => 100, // Default width
                        'height' => 100, // Default height
                        'shape' => 'SQUARE', // Default shape
                        'status' => $status,
                        'active_session' => $table->activeSession ? [
                            'id' => $table->activeSession->id,
                            'uuid' => $table->activeSession->uuid,
                            'table_id' => $table->activeSession->table_id,
                            'employee_id' => $table->activeSession->waiter_id,
                            'status' => $table->activeSession->status,
                            'guest_count' => $table->activeSession->guest_count,
                            'started_at' => $table->activeSession->opened_at?->toIso8601String(),
                            'closed_at' => $table->activeSession->closed_at?->toIso8601String(),
                            'order_count' => $orderCount,
                            'order_total' => (string) $orderTotal,
                        ] : null,
                    ];
                }),
            ];
        });

        return [
            'data' => $floors,
        ];
    }
}
