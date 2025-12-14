import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function SubcategoryPieChart({ categoryId }: { categoryId: string }) {
    const { spends } = useData();
    const { theme } = useTheme();

    // Vibrant palette for subcategories
    const COLORS = [
        '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
    ];

    const { total, data } = useMemo(() => {
        const subcategoryTotals: Record<string, number> = {};
        let total = 0;

        const filteredSpends = spends.filter(s => s.categoryId === categoryId);

        filteredSpends.forEach(spend => {
            const sub = spend.subcategory || 'General';
            subcategoryTotals[sub] = (subcategoryTotals[sub] || 0) + spend.amount;
            total += spend.amount;
        });

        if (total === 0) return { total: 0, data: [] };

        const chartData = Object.entries(subcategoryTotals)
            .map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);

        return { total, data: chartData };

    }, [spends, categoryId]);

    if (data.length === 0) return null;

    return (
        <div className="w-full bg-card rounded-xl border border-border p-4 shadow-sm mb-6">
            <h3 className="text-sm font-semibold mb-1 text-center text-muted-foreground">Spending by Subcategory</h3>
            <p className="text-2xl font-bold text-center text-primary mb-4">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>

            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
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
                        <Legend iconSize={8} fontSize={10} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
