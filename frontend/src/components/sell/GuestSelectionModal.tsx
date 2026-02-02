import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Minus, Plus, Utensils } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import type { Table } from '@/types';

interface GuestSelectionModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (count: number) => void;
    table: Table | null;
}

export default function GuestSelectionModal({
    open,
    onClose,
    onConfirm,
    table
}: GuestSelectionModalProps) {
    const [guestCount, setGuestCount] = React.useState(2);
    const quickSelections = [1, 2, 3, 4, 6, 8];

    // Reset guest count when modal opens with a new table
    React.useEffect(() => {
        if (open) {
            setGuestCount(2);
        }
    }, [open]);

    const handleConfirm = () => {
        onConfirm(guestCount);
    };

    if (!table) return null;

    return (
        <Dialog open={open} onOpenChange={(val: boolean) => !val && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">{table.name}</DialogTitle>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                Capacity: {table.capacity} Guests
                            </div>
                        </div>
                    </div>
                </DialogHeader>
                <div className="sr-only">
                    Select the number of guests for {table.name}
                </div>

                <div className="px-8 py-4 space-y-8">
                    {/* Quick Selection Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {quickSelections.map((num) => (
                            <Button
                                key={num}
                                variant="outline"
                                className={cn(
                                    "h-14 rounded-2xl border-2 font-black text-lg transition-all duration-300",
                                    guestCount === num
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                                )}
                                onClick={() => setGuestCount(num)}
                            >
                                {num}
                            </Button>
                        ))}
                    </div>

                    {/* Manual Adjuster */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Adjust Manually</div>
                        <div className="flex items-center gap-8">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                                className="w-12 h-12 rounded-2xl border-2 border-slate-100 text-slate-400 hover:border-slate-300 hover:text-primary transition-all shadow-sm active:scale-90"
                            >
                                <Minus className="w-5 h-5" />
                            </Button>

                            <div className="flex items-center gap-3 min-w-[60px] justify-center">
                                <Users className="w-6 h-6 text-primary/40" />
                                <span className="text-4xl font-black text-slate-800 tracking-tighter">{guestCount}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setGuestCount(guestCount + 1)}
                                className="w-12 h-12 rounded-2xl border-2 border-slate-100 text-slate-400 hover:border-slate-300 hover:text-primary transition-all shadow-sm active:scale-90"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-4">
                    <Button
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                        onClick={handleConfirm}
                    >
                        Confirm & Start Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
