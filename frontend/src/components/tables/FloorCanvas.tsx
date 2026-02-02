import React from 'react'
import { motion } from 'framer-motion'
import type { Table } from '@/types'
import { Users, AlertCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloorCanvasProps {
    tables: Table[]
    onTableUpdate: (tableId: number, x: number, y: number) => void
    onTableEdit?: (table: Table) => void
    isReadOnly?: boolean
}

const GRID_SIZE = 20
const DESKTOP_CANVAS_SIZE = 2000
const MOBILE_CANVAS_SIZE = 1200

export default function FloorCanvas({ tables, onTableUpdate, onTableEdit, isReadOnly }: FloorCanvasProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [pan, setPan] = React.useState({ x: 0, y: 0 })
    const [tableSize, setTableSize] = React.useState(128)
    const [canvasSize, setCanvasSize] = React.useState(DESKTOP_CANVAS_SIZE)
    const [grabOffset, setGrabOffset] = React.useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = React.useState(false)

    // Handle responsive table sizing and canvas size
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) { // Tablet/Mobile threshold
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

    // Auto-center on tables when floor loads or canvas size changes
    React.useEffect(() => {
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

        // Run immediately and after short delays to catch layout shifts
        centerFunc()
        const t1 = setTimeout(centerFunc, 50)
        const t2 = setTimeout(centerFunc, 200)

        // Also center on resize
        window.addEventListener('resize', centerFunc)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            window.removeEventListener('resize', centerFunc)
        }
    }, [tables.length, canvasSize, tableSize])

    const handleDragStart = (_table: Table, e: any) => {
        if (isReadOnly) return

        const rect = e.target.getBoundingClientRect()
        // Capture where the user grabbed the table relative to its own top-left
        setGrabOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }

    const handleDragEnd = (tableId: number, _e: any, info: any) => {
        if (isReadOnly) return

        const containerRect = containerRef.current?.getBoundingClientRect()
        if (!containerRect) return

        // 1. Calculate the new local coordinates in canvas space
        // Subtract grabOffset to keep the table's top-left relative to the cursor
        const rawX = info.point.x - containerRect.left - pan.x - grabOffset.x
        const rawY = info.point.y - containerRect.top - pan.y - grabOffset.y

        // 2. Snap to grid
        let snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE
        let snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE

        // 3. Clamp to canvas bounds
        snappedX = Math.max(0, Math.min(snappedX, canvasSize - tableSize))
        snappedY = Math.max(0, Math.min(snappedY, canvasSize - tableSize))

        // 4. Collision Avoidance (Spiral nudge)
        const isOverlap = (tx: number, ty: number) => {
            return tables.some(t => {
                if (t.id === tableId) return false
                const dx = Math.abs(t.x_pos - tx)
                const dy = Math.abs(t.y_pos - ty)
                // Threshold with 20px padding buffer to prevent 'too close' tables
                const threshold = tableSize + 20
                return dx < threshold && dy < threshold
            })
        }

        // Try nudging in a spiral if overlapping
        let finalX = snappedX
        let finalY = snappedY
        let orbit = 1
        const maxOrbit = 30 // Wide range to guarantee finding a spot

        while (isOverlap(finalX, finalY) && orbit <= maxOrbit) {
            // Check cardinal directions and diagonals with granular steps (20px)
            const offset = orbit * GRID_SIZE
            const directions = [
                [offset, 0], [-offset, 0], [0, offset], [0, -offset], // Cardinals
                [offset, offset], [-offset, -offset], [offset, -offset], [-offset, offset] // Diagonals
            ]

            let found = false
            for (const [dx, dy] of directions) {
                const nx = Math.max(0, Math.min(snappedX + dx, canvasSize - tableSize))
                const ny = Math.max(0, Math.min(snappedY + dy, canvasSize - tableSize))
                if (!isOverlap(nx, ny)) {
                    finalX = nx
                    finalY = ny
                    found = true
                    break
                }
            }
            if (found) break
            orbit++
        }

        onTableUpdate(tableId, finalX, finalY)
    }

    return (
        <div
            ref={containerRef}
            className="group relative w-full h-full bg-slate-100/50 rounded-[2rem] lg:rounded-[3rem] border-2 border-slate-200/60 overflow-hidden shadow-inner"
        >
            {/* Control Bar Overlay - Compact for tablet */}
            <div className="absolute top-3 inset-x-3 z-20 pointer-events-none flex justify-between items-start">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-3 pointer-events-auto">
                    <div className="flex items-center gap-1.5 ">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                        Available
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
                        Occupied
                    </div>
                    {!isReadOnly && (
                        <>
                            <div className="w-px h-3 bg-slate-200 mx-1" />
                            <button
                                onClick={() => setIsPanning(!isPanning)}
                                className={cn(
                                    "px-3 py-1 rounded-lg transition-all flex items-center gap-2 font-black uppercase tracking-tighter",
                                    isPanning ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                                )}
                            >
                                <MapPin className={cn("w-3 h-3", isPanning && "animate-bounce")} />
                                {isPanning ? "Map Panning Active" : "Table Move Mode"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Pannable Content Area */}
            <motion.div
                drag={isReadOnly || isPanning}
                dragMomentum={false}
                // Tighten pan constraints to prevent getting lost in white space
                // The canvas (motion.div) should be able to move such that its edges
                // align with the containerRef's edges, but not go beyond.
                // This means its x can go from (containerWidth - canvasWidth) to 0,
                // and y from (containerHeight - canvasHeight) to 0.
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
                className={cn(
                    "relative bg-white",
                    (isReadOnly || isPanning) ? "cursor-move" : "cursor-default"
                )}
                // Correct panning logic: Accumulate the offset correctly
                onDragEnd={(_, info) => {
                    if (isReadOnly || isPanning) {
                        setPan(prev => ({
                            x: prev.x + info.offset.x,
                            y: prev.y + info.offset.y
                        }))
                    }
                }}
            >
                {tables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-xl font-bold text-slate-400">Floor is empty</p>
                        </div>
                    </div>
                )}

                {tables.map((table) => {
                    const currentGuests = table.active_session?.guest_count || 0
                    const isOverCapacity = currentGuests > table.capacity

                    return (
                        <motion.div
                            key={table.id}
                            drag={!isReadOnly && !isPanning}
                            dragMomentum={false}
                            dragElastic={0} // No bounce for 'seamless' feel
                            // Constraints are relative to the parent (the 2000x2000 div)
                            dragConstraints={{
                                left: 0,
                                top: 0,
                                right: canvasSize - tableSize,
                                bottom: canvasSize - tableSize
                            }}
                            onDragStart={(e) => handleDragStart(table, e)}
                            onDragEnd={(e, info) => handleDragEnd(table.id, e, info)}
                            initial={false}
                            animate={{
                                x: table.x_pos,
                                y: table.y_pos,
                                scale: 1,
                                rotate: 0
                            }}
                            whileDrag={{
                                scale: 1.05,
                                zIndex: 100,
                                boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.2)"
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 50
                            }}
                            className={cn(
                                "absolute cursor-grab active:cursor-grabbing select-none",
                                "flex flex-col items-center justify-center rounded-[2rem] md:rounded-[2.5rem] border-4 transition-all",
                                "backdrop-blur-xl",
                                tableSize === 96 ? "w-24 h-24" : "w-32 h-32",
                                table.status === 'AVAILABLE'
                                    ? "bg-white/95 border-emerald-500/20 text-emerald-900 shadow-xl shadow-emerald-500/5 hover:border-emerald-500"
                                    : "bg-orange-50/95 border-orange-500/20 text-orange-950 shadow-xl shadow-orange-500/5 hover:border-orange-500",
                                isOverCapacity && "border-red-600 animate-pulse bg-red-50/95 shadow-red-500/30",
                                isPanning && "opacity-50 pointer-events-none"
                            )}
                            style={{
                                left: 0,
                                top: 0,
                            }}
                            onDoubleClick={() => onTableEdit?.(table)}
                        >
                            <div className={cn(
                                "font-black tracking-tighter",
                                tableSize === 96 ? "text-lg" : "text-xl"
                            )}>{table.name}</div>

                            <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full font-black uppercase tracking-[0.1em]",
                                tableSize === 96 ? "mt-1.5 text-[8px]" : "mt-3 text-[10px]",
                                isOverCapacity ? "bg-red-600 text-white" : "bg-slate-200/90 text-slate-500"
                            )}>
                                {isOverCapacity ? <AlertCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" /> : <Users className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />}
                                {currentGuests} / {table.capacity}
                            </div>

                            {table.status === 'OCCUPIED' && (
                                <div className={cn(
                                    "absolute bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full shadow-lg border-white",
                                    tableSize === 96 ? "-top-1.5 -right-1.5 p-1 border-2" : "-top-3 -right-3 p-2 border-4"
                                )}>
                                    <div className={cn(
                                        "rounded-full bg-white animate-ping",
                                        tableSize === 96 ? "w-1.5 h-1.5" : "w-2.5 h-2.5"
                                    )} />
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>

            <div className="absolute bottom-6 right-6 pointer-events-none bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border border-white/20">
                Floor Canvas • {canvasSize}x{canvasSize}
            </div>
        </div>
    )
}
