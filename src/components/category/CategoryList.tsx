import { useData } from '../../context/DataContext';
import { Wallet, Trash2 } from 'lucide-react';

export function CategoryList({ onCategoryClick }: { onCategoryClick: (id: string) => void }) {
    const { categories, spends, deleteCategory } = useData();

    if (categories.length === 0) return null;

    const currentMonthSpends = spends.filter(s => {
        const d = new Date(s.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.description !== 'Bill Settled' && s.amount > 0;
    });

    // Grouping Logic
    const groupedCategories = categories.reduce((acc, category) => {
        // Use explicit group OR heuristic (First word of name)
        const groupName = category.group || category.name.split(' ')[0] || 'Other';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(category);
        return acc;
    }, {} as Record<string, typeof categories>);

    const sortedGroups = Object.keys(groupedCategories).sort();

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground px-1">Your Categories</h2>

            {sortedGroups.map(groupName => (
                <div key={groupName} className="space-y-2.5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 border-b border-border pb-1">
                        {groupName}
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                        {groupedCategories[groupName].map((category) => {
                            const count = currentMonthSpends.filter(s => s.categoryId === category.id).length;
                            const catSpends = spends.filter(s => s.categoryId === category.id);
                            const netBal = catSpends.reduce((acc, s) => acc + s.amount, 0);

                            return (
                                <div
                                    key={category.id}
                                    onClick={() => onCategoryClick(category.id)}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-pointer active:scale-98"
                                >
                                    {/* Color accent strip */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5"
                                        style={{ backgroundColor: category.color }}
                                    />

                                    <div className="flex items-center justify-between pl-2.5 sm:pl-3 gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className="p-2.5 rounded-xl shrink-0"
                                                style={{ color: category.color, backgroundColor: `${category.color}15` }}
                                            >
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-foreground text-sm truncate">{category.name}</h3>
                                                    {category.cardNumber && (
                                                        <span className="text-[10px] text-muted-foreground font-mono opacity-50 shrink-0">
                                                            {category.cardNumber.length > 8 ? `••${category.cardNumber.slice(-4)}` : category.cardNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {count} {count === 1 ? 'Spend' : 'Spends'} <span className="opacity-60">(This Month)</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            {netBal > 0.01 ? (
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block leading-none mb-0.5">Due</span>
                                                    <span className="text-sm font-bold text-orange-500 whitespace-nowrap">
                                                        ₹{netBal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    Settled
                                                </span>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Delete category "${category.name}"?`)) deleteCategory(category.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all shrink-0"
                                                title="Delete Card"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
