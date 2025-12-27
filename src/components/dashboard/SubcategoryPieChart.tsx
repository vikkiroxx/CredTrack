import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function SubcategoryPieChart({ categoryId, showTotal = true }: { categoryId: string, showTotal?: boolean }) {
    const { spends } = useData();
    const { theme } = useTheme();

    // Vibrant palette for subcategories
    const COLORS = [
        '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
    ];

    const { total, data } = useMemo(() => {
        const subcategoryTotals: Record<string, number> = {};

        // 1. Calculate Net Balance (Visual Truth of the account)
        const netBalance = spends
            .filter(s => s.categoryId === categoryId)
            .reduce((sum, s) => sum + s.amount, 0);

        // 2. Identify Active (Unpaid) Spends for breakdown
        // These are the "Fresh Start" items for the new month/period
        const activeSpends = spends.filter(s => s.categoryId === categoryId && !s.isPaid);

        let activeTotal = 0;
        activeSpends.forEach(spend => {
            const sub = spend.subcategory || 'General';
            subcategoryTotals[sub] = (subcategoryTotals[sub] || 0) + spend.amount;
            activeTotal += spend.amount;
        });

        // 3. Determine if there is "Carried Over" balance
        // If Net > Active, it means there is residual debt not covered by specific unpaid items
        // (e.g., from a partial payment of the previous bill)
        const remainingHistory = netBalance - activeTotal;

        if (remainingHistory > 0.01) {
            // Add a single slice for the "Settled/Remaining" balance
            subcategoryTotals['Bill Settled'] = remainingHistory;
        }

        // If total is zero or negative (overpaid), show nothing
        if (netBalance <= 0.01) return { total: 0, data: [] };

        const chartData = Object.entries(subcategoryTotals)
            .map(([name, value], index) => ({
                name,
                value,
                color: name === 'Bill Settled' ? '#ef4444' : COLORS[index % COLORS.length] // Red for debt, vibrant for others
            }))
            .sort((a, b) => b.value - a.value);

        return { total: netBalance, data: chartData };

    }, [spends, categoryId]);

    if (data.length === 0) return null;

    return (
        <div className="w-full bg-card rounded-xl border border-border p-4 shadow-sm mb-6">
            {showTotal && (
                <>
                    <h3 className="text-sm font-semibold mb-1 text-center text-muted-foreground">Spending Breakdown</h3>
                    <p className="text-2xl font-bold text-center text-primary mb-4">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </>
            )}

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
