import { Member } from '@/types/expense';
import { X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: Member & { balance: number };
  onRemove: (id: string) => void;
}

export function MemberCard({ member, onRemove }: MemberCardProps) {
  const isPositive = member.balance > 0.01;
  const isNegative = member.balance < -0.01;

  return (
    <div className="group flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-card transition-all duration-200 animate-scale-in">
      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{member.name}</p>
        <p className={cn(
          "text-sm font-medium",
          isPositive && "text-credit",
          isNegative && "text-debt",
          !isPositive && !isNegative && "text-muted-foreground"
        )}>
          {isPositive && "+"}₹{Math.abs(member.balance).toFixed(2)}
          {isPositive && <span className="text-xs ml-1">gets back</span>}
          {isNegative && <span className="text-xs ml-1">owes</span>}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        onClick={() => onRemove(member.id)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
