import { Member } from '@/types/expense';
import { useCurrency } from '@/components/CurrencyContext';
import { X, User, Pencil, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: Member & { balance: number };
  onRemove: (id: string) => void;
  onSettle?: (member: Member) => void;
  onEdit?: (member: Member) => void;
}

export function MemberCard({ member, onRemove, onSettle, onEdit }: MemberCardProps) {
  const { currency } = useCurrency();
  const isPositive = member.balance > 0.01;
  const isNegative = member.balance < -0.01;

  return (
    <div className="group flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-card transition-all duration-200 animate-scale-in">
      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{member.name}</p>
        {member.email && <p className="text-[10px] text-muted-foreground truncate -mt-0.5">{member.email}</p>}
        {member.upiId && <p className="text-[10px] text-primary/80 font-mono truncate">UPI: {member.upiId}</p>}
        <p className={cn(
          "text-sm font-medium",
          isPositive && "text-credit",
          isNegative && "text-debt",
          !isPositive && !isNegative && "text-muted-foreground"
        )}>
          {isPositive && "+"}{currency}{Math.abs(member.balance).toFixed(2)}
          {isPositive && <span className="text-xs ml-1">gets back</span>}
          {isNegative && <span className="text-xs ml-1">owes</span>}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {isNegative && onSettle && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs font-bold gap-1 border-debt/20 text-debt hover:bg-debt/10"
            onClick={() => onSettle(member)}
          >
            <Wallet className="w-3 h-3" /> Settle
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onEdit(member)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(member.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
