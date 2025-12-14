import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function SpendingPieChart() {
    const { spends, categories } = useData();
    const { theme } = useTheme();

    const data = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        spends.forEach(spend => {
            // Group by categoryId, sum amounts
            const catId = spend.categoryId;
            categoryTotals[catId] = (categoryTotals[catId] || 0) + spend.amount;
        });

        // Transform to array for Recharts
        return Object.entries(categoryTotals)
            .map(([catId, total]) => {
                const category = categories.find(c => c.id === catId);
                return {
                    name: category?.name || 'Unknown',
                    value: total,
                    color: category?.color || '#94a3b8'
                };
            })
            .filter(item => item.value > 0) // Hide empty categories
            .sort((a, b) => b.value - a.value); // Biggest slices first

    }, [spends, categories]);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-card rounded-xl border border-border p-6">
                <p>No data to chart yet.</p>
                <p className="text-xs">Add some spends!</p>
            </div>
        );
    }

    const totalSpent = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="w-full bg-card rounded-xl border border-border p-4 shadow-sm">
            <h2 className="text-lg font-bold mb-1 text-center">Spending Breakdown</h2>
            <p className="text-3xl font-bold text-center text-primary mb-6">
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
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`₹${value}`, 'Spent']}
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

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 px-2">
                {data.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
