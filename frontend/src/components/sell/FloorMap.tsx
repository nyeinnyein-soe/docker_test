import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { Floor, Table } from '@/types'

interface FloorMapProps {
  floors: Floor[]
  selectedFloor: number | null
  onFloorSelect: (floorId: number) => void
  onTableSelect: (table: Table) => void
}

export default function FloorMap({
  floors,
  selectedFloor,
  onFloorSelect,
  onTableSelect,
}: FloorMapProps) {
  const currentFloor = floors.find((f) => f.id === selectedFloor)
  const tables = currentFloor?.tables || []

  const getTableColor = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-primary text-white'
      case 'RESERVED':
        return 'bg-warning text-white'
      default:
        return 'bg-secondary hover:bg-secondary/80'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Floor tabs */}
      <div className="flex gap-2 p-4 border-b overflow-x-auto">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => onFloorSelect(floor.id)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0',
              selectedFloor === floor.id
                ? 'bg-primary text-white'
                : 'bg-secondary hover:bg-secondary/80'
            )}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Floor map */}
      <div className="flex-1 p-4 overflow-y-auto">
        {tables.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No tables on this floor</p>
          </div>
        ) : (
          <div className="relative bg-secondary/20 rounded-xl p-4 min-h-full">
            {/* Grid of tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onTableSelect(table)}
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center transition-all touch-target',
                    getTableColor(table.status),
                    table.shape === 'ROUND' && 'rounded-full'
                  )}
                >
                  <span className="text-lg font-bold">{table.name}</span>
                  <span className="text-xs opacity-80">
                    {table.capacity} seats
                  </span>
                  {table.active_session && (
                    <>
                      <span className="text-xs mt-1">
                        {table.active_session.guest_count} guests
                      </span>
                      {table.active_session.order_count !== undefined && table.active_session.order_count > 0 && (
                        <span className="text-xs mt-1 font-semibold">
                          {table.active_session.order_count} order{table.active_session.order_count > 1 ? 's' : ''} • {formatCurrency(parseFloat(table.active_session.order_total || '0'))}
                        </span>
                      )}
                      {table.active_session.order_count === 0 && (
                        <span className="text-xs mt-1 opacity-60">
                          No orders yet
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning" />
          <span>Reserved</span>
        </div>
      </div>
    </div>
  )
}
