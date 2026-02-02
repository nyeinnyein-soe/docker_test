import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { Floor, Table } from '@/types'

const DESKTOP_CANVAS_SIZE = 2000
const MOBILE_CANVAS_SIZE = 1200
const GRID_SIZE = 20

interface FloorMapProps {
  floors: Floor[]
  selectedFloor: number | null
  onFloorSelect: (id: number) => void
  onTableSelect: (table: Table) => void
  isLoading?: boolean
}

export default function FloorMap({
  floors,
  selectedFloor,
  onFloorSelect,
  onTableSelect,
  isLoading = false
}: FloorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tableSize, setTableSize] = useState(128)
  const [canvasSize, setCanvasSize] = useState(DESKTOP_CANVAS_SIZE)

  const currentFloor = floors.find((f) => f.id === selectedFloor)
  const tables = currentFloor?.tables || []

  // Handle responsive table sizing and canvas size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setTableSize(96)
        setCanvasSize(MOBILE_CANVAS_SIZE)
      } else {
        setTableSize(128)
        setCanvasSize(DESKTOP_CANVAS_SIZE)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-center on tables when floor changes or canvas size changes
  useEffect(() => {
    if (!containerRef.current) return

    const centerFunc = () => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      if (containerRect.width === 0 || containerRect.height === 0) return

      if (tables.length > 0) {
        const minX = Math.min(...tables.map(t => t.x_pos))
        const maxX = Math.max(...tables.map(t => t.x_pos + tableSize))
        const minY = Math.min(...tables.map(t => t.y_pos))
        const maxY = Math.max(...tables.map(t => t.y_pos + tableSize))

        const tablesCenterX = minX + ((maxX - minX) / 2)
        const tablesCenterY = minY + ((maxY - minY) / 2)

        setPan({
          x: Math.min(0, (containerRect.width / 2) - tablesCenterX),
          y: Math.min(0, (containerRect.height / 2) - tablesCenterY)
        })
      } else {
        setPan({
          x: Math.min(0, (containerRect.width / 2) - (canvasSize / 2)),
          y: Math.min(0, (containerRect.height / 2) - (canvasSize / 2))
        })
      }
    }

    centerFunc()
    const t1 = setTimeout(centerFunc, 50)
    const t2 = setTimeout(centerFunc, 200)

    window.addEventListener('resize', centerFunc)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', centerFunc)
    }
  }, [selectedFloor, canvasSize, tableSize, tables.length])

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Floor tabs - Improved for mobile */}
      <div className="flex gap-2 p-3 md:p-4 border-b bg-white/80 backdrop-blur-md overflow-x-auto scrollbar-none sticky top-0 z-20 shadow-sm">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => onFloorSelect(floor.id)}
            className={cn(
              'px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all flex-shrink-0 border uppercase tracking-widest',
              selectedFloor === floor.id
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            )}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Floor map canvas */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-100/30 backdrop-blur-[2px] space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl border-4 border-primary/10 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Mapping Floor...</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No tables on this floor</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative w-full h-full bg-slate-200/40 rounded-3xl overflow-hidden shadow-inner border border-slate-300/50"
          >
            <motion.div
              drag
              dragMomentum={false}
              dragConstraints={containerRef.current ? {
                left: containerRef.current.clientWidth - canvasSize,
                right: 0,
                top: containerRef.current.clientHeight - canvasSize,
                bottom: 0,
              } : undefined}
              style={{
                width: canvasSize,
                height: canvasSize,
                x: pan.x,
                y: pan.y,
                backgroundImage: `
                  radial-gradient(circle, #cbd5e1 1px, transparent 1px),
                  linear-gradient(to right, #f1f5f9 1px, transparent 1px),
                  linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              }}
              className="relative bg-white cursor-move"
              onDragEnd={(_, info) => setPan(prev => ({
                x: prev.x + info.offset.x,
                y: prev.y + info.offset.y
              }))}
            >
              {tables.map((table) => {
                const currentGuests = table.active_session?.guest_count || 0
                const isOverCapacity = currentGuests > table.capacity

                return (
                  <button
                    key={table.id}
                    onClick={() => onTableSelect(table)}
                    className={cn(
                      'absolute flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 touch-target',
                      'border-4',
                      tableSize === 96 ? 'w-24 h-24 rounded-[1.8rem]' : 'w-32 h-32 rounded-[2.2rem]',
                      table.status === 'AVAILABLE'
                        ? 'bg-white border-emerald-500/20 text-emerald-800 hover:border-emerald-500'
                        : 'bg-primary border-primary/10 text-white shadow-primary/20',
                      isOverCapacity && 'border-red-600 animate-pulse'
                    )}
                    style={{
                      left: table.x_pos,
                      top: table.y_pos,
                    }}
                  >
                    <span className={cn(
                      "font-black mb-1",
                      tableSize === 96 ? "text-lg" : "text-xl"
                    )}>{table.name}</span>

                    <div className={cn(
                      "flex items-center gap-1 rounded-full font-black uppercase tracking-widest",
                      tableSize === 96 ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[10px]",
                      table.status === 'AVAILABLE' ? "bg-emerald-50 text-emerald-600" : "bg-white/20 text-white shadow-inner"
                    )}>
                      {currentGuests || 0} / {table.capacity}
                    </div>

                    {table.active_session && (
                      <div className={cn(
                        "flex flex-col items-center gap-0.5",
                        tableSize === 96 ? "mt-1" : "mt-2"
                      )}>
                        {table.active_session.order_count !== undefined && table.active_session.order_count > 0 && (
                          <div className="flex flex-col items-center gap-0 font-bold">
                            <span className={cn(
                              "bg-white/30 backdrop-blur-sm px-2 rounded-lg leading-tight",
                              tableSize === 96 ? "text-[8px]" : "text-[10px]"
                            )}>{table.active_session.order_count} Items</span>
                            <span className={cn(
                              "tracking-tighter",
                              tableSize === 96 ? "text-[10px]" : "text-xs"
                            )}>{formatCurrency(parseFloat(table.active_session.order_total || '0'))}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {table.status === 'OCCUPIED' && (
                      <div className={cn(
                        "absolute bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full shadow-lg border-white",
                        tableSize === 96 ? "-top-2 -right-2 p-1 border-2" : "-top-3 -right-3 p-2 border-4"
                      )}>
                        <div className={cn(
                          "rounded-full bg-white animate-ping",
                          tableSize === 96 ? "w-2 h-2" : "w-2.5 h-2.5"
                        )} />
                      </div>
                    )}
                  </button>
                )
              })}
            </motion.div>

            {/* Hint overlay */}
            <div className="absolute bottom-4 right-4 pointer-events-none bg-slate-900/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-slate-800 uppercase tracking-widest border border-white/20">
              Drag map to pan
            </div>
          </div>
        )}
      </div>

      {/* Legend - Responsive wrapping */}
      <div className="p-4 border-t flex flex-wrap gap-4 md:gap-8 justify-center text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-white border-2 border-emerald-500/30 shadow-sm" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary shadow-lg shadow-primary/20" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-red-500 animate-pulse" />
          <span>Over Capacity</span>
        </div>
      </div>
    </div>
  )
}

