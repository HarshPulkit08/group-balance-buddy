import { Settlement } from '@/types/expense';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface SettlementCardProps {
  settlements: Settlement[];
}

export function SettlementCard({ settlements }: SettlementCardProps) {
  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7 text-success" />
        </div>
        <p className="font-medium text-foreground">All settled up!</p>
        <p className="text-sm text-muted-foreground">No payments needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        {settlements.length} payment{settlements.length > 1 ? 's' : ''} to settle all debts:
      </p>
      {settlements.map((s, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="w-9 h-9 rounded-full bg-debt/10 flex items-center justify-center text-debt font-semibold text-sm">
            {s.from.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="font-medium text-foreground">{s.from}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border">
            <span className="text-sm font-semibold text-primary">₹{s.amount.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 text-right">
            <span className="font-medium text-foreground">{s.to}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-credit/10 flex items-center justify-center text-credit font-semibold text-sm">
            {s.to.charAt(0).toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}
