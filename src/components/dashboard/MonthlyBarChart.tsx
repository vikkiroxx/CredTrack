import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';

export function MonthlyBarChart() {
    const { spends } = useData();

    const data = useMemo(() => {
        const monthlyData: Record<string, number> = {};

        spends.forEach(spend => {
            // Only count actual spending/purchases, ignore bill settlement repayments
            if (spend.description === 'Bill Settled' || spend.amount <= 0) return;

            const date = parseISO(spend.date);

            // Filter out future months
            if (date > new Date()) return;

            const monthKey = format(startOfMonth(date), 'yyyy-MM'); // Group key

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += spend.amount;
        });

        // Convert to array and sort by date
        return Object.entries(monthlyData)
            .map(([key, value]) => ({
                month: format(parseISO(key + '-01'), 'MMM yy'), // Label: "Dec 24"
                amount: Math.round(value),
                rawDate: key
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
            .slice(-6); // Last 6 months only
    }, [spends]);

    if (data.length === 0) return null;

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-bold">Monthly Trends</h3>
                <p className="text-xs text-muted-foreground">Actual monthly spending (last 6 months)</p>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fontWeight: 'bold', fill: '#e2e8f0' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fontWeight: 'bold', fill: '#e2e8f0' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--popover-foreground))'
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                        />
                        <Bar
                            dataKey="amount"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
