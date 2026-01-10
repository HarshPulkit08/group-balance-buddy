import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCurrency } from '@/components/CurrencyContext';

interface SpendingChartProps {
  data: { name: string; amount: number }[];
}

const COLORS = [
  'hsl(160, 60%, 40%)',
  'hsl(170, 55%, 45%)',
  'hsl(180, 50%, 40%)',
  'hsl(190, 55%, 42%)',
  'hsl(200, 50%, 45%)',
  'hsl(210, 45%, 48%)',
];

export function SpendingChart({ data }: SpendingChartProps) {
  const { currency } = useCurrency();
  if (data.length === 0 || data.every(d => d.amount === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No spending data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          tickFormatter={(value) => `${currency}${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2">
                  <p className="font-medium text-foreground">{payload[0].payload.name}</p>
                  <p className="text-primary font-semibold">{currency}{payload[0].value?.toLocaleString()}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
