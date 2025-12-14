import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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
            <h2 className="text-lg font-bold mb-4 text-center">Spending Breakdown</h2>

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
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-4">
                    <p className="text-xs text-muted-foreground font-medium">Total</p>
                    <p className="text-xl font-bold">₹{totalSpent.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
