import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { isSameMonth, parseISO } from 'date-fns';

export function SpendingPieChart() {
    const { spends, categories } = useData();
    const { theme } = useTheme();
    const [period, setPeriod] = useState<'month' | 'all'>('month');

    const today = new Date();

    const data = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        spends.forEach(spend => {
            // Only count actual spending, exclude debt settlements
            if (spend.description === 'Bill Settled' || spend.amount <= 0) return;

            const spendDate = parseISO(spend.date);
            if (period === 'month' && !isSameMonth(spendDate, today)) return;

            const catId = spend.categoryId;
            categoryTotals[catId] = (categoryTotals[catId] || 0) + spend.amount;
        });

        // Transform to array for Recharts
        return Object.entries(categoryTotals)
            .map(([catId, total]) => {
                const category = categories.find(c => c.id === catId);
                return {
                    name: category?.name || 'Unknown',
                    value: Math.round(total * 100) / 100,
                    color: category?.color || '#94a3b8'
                };
            })
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value); // Biggest slices first

    }, [spends, categories, period]);

    const totalSpent = useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.value, 0);
    }, [data]);

    return (
        <div className="w-full bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Spending Breakdown</h2>
                {/* Period Selector Toggle */}
                <div className="flex bg-muted/60 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-2.5 py-1 rounded-md transition-all ${period === 'month' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setPeriod('all')}
                        className={`px-2.5 py-1 rounded-md transition-all ${period === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border p-6 my-4">
                    <p className="text-sm font-medium">No spends recorded for {period === 'month' ? 'this month' : 'this period'}.</p>
                </div>
            ) : (
                <>
                    <p className="text-3xl font-bold text-center text-primary mb-4">
                        ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>

                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => {
                                        const pct = totalSpent > 0 ? ((value / totalSpent) * 100).toFixed(1) : '0';
                                        return [`₹${value.toLocaleString('en-IN')} (${pct}%)`, 'Spent'];
                                    }}
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                        borderRadius: '8px',
                                        color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                                    }}
                                    itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom Legend with Percentage and Amounts */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2 max-h-48 overflow-y-auto">
                        {data.map((entry) => {
                            const pct = totalSpent > 0 ? ((entry.value / totalSpent) * 100).toFixed(0) : '0';
                            return (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                    <span className="text-muted-foreground">{entry.name}</span>
                                    <span className="font-semibold text-foreground">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
