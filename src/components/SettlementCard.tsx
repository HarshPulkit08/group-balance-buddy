import { Settlement } from '@/types/expense';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface SettlementCardProps {
  settlements: Settlement[];
}

export function SettlementCard({ settlements }: SettlementCardProps) {
  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <p className="font-black text-foreground uppercase tracking-wider">All settled up!</p>
        <p className="text-xs text-muted-foreground font-medium mt-1">Everyone is square.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {settlements.length} Payment{settlements.length > 1 ? 's' : ''} Needed
        </p>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-full border border-primary/10">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Simplified</span>
        </div>
      </div>

      <div className="space-y-3">
        {settlements.map((s, index) => (
          <div
            key={index}
            className="group relative flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-destructive/5 flex items-center justify-center text-destructive font-bold text-xs border border-destructive/10">
                {s.from.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-foreground truncate text-sm">{s.from}</span>
            </div>

            <div className="flex flex-col items-center px-4 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-0.5 w-4 bg-border/50"></div>
                <ArrowRight className="w-4 h-4 text-primary animate-pulse" />
                <div className="h-0.5 w-4 bg-border/50"></div>
              </div>
              <span className="text-sm font-black text-primary tracking-tight">₹{s.amount.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
              <span className="font-bold text-foreground truncate text-sm text-right">{s.to}</span>
              <div className="w-9 h-9 rounded-full bg-green-500/5 flex items-center justify-center text-green-600 font-bold text-xs border border-green-500/10">
                {s.to.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest pt-4 opacity-50">
        Transactions minimized for efficiency
      </p>
    </div>
  );
}
