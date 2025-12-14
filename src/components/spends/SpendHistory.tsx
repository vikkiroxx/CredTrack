import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Calendar } from 'lucide-react';
import { format, parseISO, isSameMonth } from 'date-fns';

export function SpendHistory() {
    const { spends, categories } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));

    const filteredSpends = useMemo(() => {
        return spends.filter(spend => {
            // 1. Date Filter
            const spendDate = parseISO(spend.date);
            const filterDate = parseISO(monthFilter + '-01'); // Ensure valid date object
            if (!isSameMonth(spendDate, filterDate)) return false;

            // 2. Search Filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const category = categories.find(c => c.id === spend.categoryId);
                const matchesDesc = spend.description.toLowerCase().includes(term);
                const matchesCat = category?.name.toLowerCase().includes(term);
                const matchesSub = spend.subcategory?.toLowerCase().includes(term);

                return matchesDesc || matchesCat || matchesSub;
            }
            return true;
        })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
    }, [spends, categories, searchTerm, monthFilter]);

    const totalFiltered = filteredSpends.reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="sticky top-0 bg-background pt-2 pb-4 z-10 space-y-3 border-b border-border">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/50 border border-input rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between">
                    <div className="relative">
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="bg-muted/50 border border-input rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total View</p>
                        <p className="text-lg font-bold">₹{totalFiltered.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 pb-20">
                {filteredSpends.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    filteredSpends.map(spend => {
                        const category = categories.find(c => c.id === spend.categoryId);
                        return (
                            <div key={spend.id} className="flex justify-between items-center p-3 bg-card border border-border rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                                        style={{ backgroundColor: category?.color || '#ccc', color: 'white' }}
                                    >
                                        {/* Icon or first letter */}
                                        {category?.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{spend.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{format(parseISO(spend.date), 'dd MMM, yyyy')}</span>
                                            {spend.subcategory && (
                                                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{spend.subcategory}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap ml-2">
                                    <p className="font-bold">₹{spend.amount.toLocaleString()}</p>
                                    {spend.isRecurring && (
                                        <p className="text-[10px] text-blue-500 font-medium">EMI</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
