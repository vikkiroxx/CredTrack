import { useData } from '../../context/DataContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { CheckCircle2, Circle, Repeat, Trash2, Tag } from 'lucide-react';

export function SpendList({ filterCategoryId }: { filterCategoryId?: string }) {
    const { spends, categories, updateSpend, deleteSpend } = useData();

    const filteredSpends = filterCategoryId
        ? spends.filter(s => s.categoryId === filterCategoryId)
        : spends;

    if (filteredSpends.length === 0) {
        return (
            <div className="text-center py-10 opacity-50">
                <p>No spends found.</p>
            </div>
        );
    }

    // Sort spends by date desc
    const sortedSpends = [...filteredSpends].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Group by Date
    const groupedSpends: { date: string; items: typeof spends }[] = [];
    sortedSpends.forEach(spend => {
        const dateStr = spend.date;
        const lastGroup = groupedSpends[groupedSpends.length - 1];

        if (lastGroup && isSameDay(parseISO(lastGroup.date), parseISO(dateStr))) {
            lastGroup.items.push(spend);
        } else {
            groupedSpends.push({ date: dateStr, items: [spend] });
        }
    });

    const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#94a3b8';
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-6 pb-20"> {/* pb-20 for FAB space */}
            {groupedSpends.map((group) => (
                <div key={group.date} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                        {format(parseISO(group.date), 'EEE, dd MMM')}
                    </h3>

                    <div className="space-y-3">
                        {group.items.map((spend) => (
                            <div
                                key={spend.id}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border bg-card transition-all",
                                    spend.isPaid ? "border-primary/20 bg-primary/5" : "border-border"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button
                                        onClick={() => updateSpend(spend.id, { isPaid: !spend.isPaid })}
                                        className={cn(
                                            "shrink-0 transition-colors",
                                            spend.isPaid ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {spend.isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>

                                    <div className="min-w-0">
                                        <p className={cn("font-medium truncate", spend.isPaid && "line-through text-muted-foreground")}>
                                            {spend.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span
                                                className="inline-block w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: getCategoryColor(spend.categoryId) }}
                                            />
                                            <span className="truncate max-w-[80px]">{getCategoryName(spend.categoryId)}</span>

                                            {spend.subcategory && (
                                                <>
                                                    <span className="opacity-50">•</span>
                                                    <span className="flex items-center gap-0.5 truncate text-foreground/70">
                                                        <Tag className="w-3 h-3" />
                                                        {spend.subcategory}
                                                    </span>
                                                </>
                                            )}

                                            {spend.isRecurring && (
                                                <>
                                                    <span className="opacity-50">•</span>
                                                    <Repeat className="w-3 h-3 text-blue-500" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 pl-2">
                                    <span className={cn("font-bold whitespace-nowrap", spend.isPaid ? "text-muted-foreground" : "text-foreground")}>
                                        ₹{spend.amount}
                                    </span>
                                    <button
                                        onClick={() => { if (confirm("Delete spend?")) deleteSpend(spend.id); }}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
