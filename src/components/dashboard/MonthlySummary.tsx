import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { format, isSameMonth, parseISO, differenceInDays, addDays, isAfter } from 'date-fns';
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { InitialSpendData } from '../spends/AddSpendForm';

export function MonthlySummary({ onPayClick }: { onPayClick: (data?: InitialSpendData) => void }) {
    const { spends, categories } = useData();

    const today = new Date();

    // Calculate Monthly Totals
    const { totalSpent, totalPending } = useMemo(() => {
        let spent = 0;
        let pending = 0;

        spends.forEach(spend => {
            const spendDate = parseISO(spend.date);
            if (isSameMonth(spendDate, today)) {
                spent += spend.amount;
                if (!spend.isPaid) {
                    pending += spend.amount;
                }
            }
        });

        return { totalSpent: spent, totalPending: pending };
    }, [spends]);

    // Find Upcoming Bills (Next 7 Days)
    const upcomingItems = useMemo(() => {
        const items: Array<{
            id: string; // Spend ID (EMI) or Category ID (Bill)
            name: string;
            date: Date;
            type: 'bill' | 'emi';
            amount?: number;
            color?: string;
            categoryId: string; // Needed for Pay function
        }> = [];

        const nextWeek = addDays(today, 7);

        // Check Categories
        categories.forEach(cat => {
            if (cat.nextBillDate) {
                const billDate = parseISO(cat.nextBillDate);
                const d = new Date(billDate); d.setHours(0, 0, 0, 0);
                const t = new Date(today); t.setHours(0, 0, 0, 0);
                const nw = new Date(nextWeek); nw.setHours(23, 59, 59, 999);

                // If date is today or in future AND before next week
                if (d >= t && d <= nw) {
                    items.push({
                        id: cat.id,
                        name: `${cat.name}`,
                        date: billDate,
                        type: 'bill',
                        color: cat.color,
                        categoryId: cat.id
                    });
                }
            }
        });

        // Check Recurring Spends (EMIs)
        spends.forEach(spend => {
            if (spend.isRecurring && spend.dueDate && !spend.isPaid) {
                const dueDate = parseISO(spend.dueDate);
                const d = new Date(dueDate); d.setHours(0, 0, 0, 0);
                const t = new Date(today); t.setHours(0, 0, 0, 0);
                const nw = new Date(nextWeek); nw.setHours(23, 59, 59, 999);

                // Check End Date
                if (spend.emiEndDate) {
                    const endDate = parseISO(spend.emiEndDate);
                    const e = new Date(endDate); e.setHours(23, 59, 59, 999);
                    if (isAfter(t, e)) return;
                }

                if (d >= t && d <= nw) {
                    items.push({
                        id: spend.id,
                        name: spend.description,
                        date: dueDate,
                        type: 'emi',
                        amount: spend.amount,
                        categoryId: spend.categoryId
                    });
                }
            }
        });

        return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [categories, spends]);

    return (
        <div className="space-y-6 mb-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground z-10">Total Spent (This Month)</p>
                    <p className="text-xl font-bold text-primary mt-1 z-10">₹{totalSpent.toLocaleString()}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-12 h-12 text-orange-500" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground z-10">Pending Bills</p>
                    <p className="text-xl font-bold text-orange-500 mt-1 z-10">₹{totalPending.toLocaleString()}</p>
                </div>
            </div>

            {/* Upcoming Section (Only if there are items) */}
            {upcomingItems.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Coming Up (Next 7 Days)</h3>
                    </div>
                    <div className="space-y-3">
                        {upcomingItems.map((item) => {
                            const days = differenceInDays(item.date, today);
                            return (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg group">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold", item.type === 'bill' ? "text-white" : "bg-primary/10 text-primary")}
                                            style={item.color ? { backgroundColor: item.color } : {}}
                                        >
                                            {item.type === 'bill' ? format(item.date, 'd') : 'EMI'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {days === 0 ? 'Due Today' : `Due in ${days} days`} • {format(item.date, 'MMM d')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {item.amount && (
                                            <p className="text-sm font-bold">₹{item.amount.toLocaleString()}</p>
                                        )}
                                        <button
                                            onClick={() => onPayClick({
                                                amount: item.amount,
                                                description: item.name,
                                                categoryId: item.categoryId
                                            })}
                                            className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
                                        >
                                            Pay
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
