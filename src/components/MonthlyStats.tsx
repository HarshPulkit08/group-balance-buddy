import { useMemo } from 'react';
import { useCurrency } from '@/components/CurrencyContext';
import { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, eachMonthOfInterval, min as minDate, max as maxDate, isSameMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyStatsProps {
    expenses: Expense[];
}

export const MonthlyStats = ({ expenses }: MonthlyStatsProps) => {
    const { currency } = useCurrency();
    const chartData = useMemo(() => {
        if (expenses.length === 0) return [];

        const dates = expenses.map(e => e.createdAt);
        const start = startOfMonth(minDate(dates));
        const end = startOfMonth(maxDate(dates));

        const months = eachMonthOfInterval({ start, end });

        return months.map(month => {
            const monthTotal = expenses
                .filter(e => isSameMonth(e.createdAt, month))
                .reduce((sum, e) => sum + e.amount, 0);

            return {
                month: format(month, 'MMM yyyy'),
                amount: Math.round(monthTotal * 100) / 100,
            };
        });
    }, [expenses]);

    if (expenses.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartData.map(data => (
                    <Card key={data.month} className="bg-primary/5 border-none shadow-none">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{data.month}</p>
                            <h3 className="text-2xl font-bold text-primary">{currency}{data.amount.toLocaleString()}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="p-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            fontSize={12}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            fontSize={12}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => `${currency}${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`${currency}${value.toLocaleString()}`, 'Spent']}
                        />
                        <Bar
                            dataKey="amount"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};
