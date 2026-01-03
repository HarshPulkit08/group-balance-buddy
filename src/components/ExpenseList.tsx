import { Expense, Member } from '@/types/expense';
import { Receipt, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onEdit: (expense: Expense) => void;
  onRemove: (id: string) => void;
}

export function ExpenseList({ expenses, members, onEdit, onRemove }: ExpenseListProps) {
  const getMemberName = (id: string) => 
    members.find(m => m.id === id)?.name ?? 'Unknown';

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No expenses yet</p>
        <p className="text-sm text-muted-foreground/70">Add your first expense above</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.slice().reverse().map((expense, index) => (
        <div 
          key={expense.id}
          className="group flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-card transition-all duration-200 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
            {getMemberName(expense.payerId).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {getMemberName(expense.payerId)}
              </span>
              <span className="text-muted-foreground">paid</span>
              <span className="font-semibold text-primary">₹{expense.amount.toFixed(2)}</span>
            </div>
            {expense.note && (
              <p className="text-sm text-muted-foreground truncate">{expense.note}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">
              {format(expense.createdAt, 'MMM d, h:mm a')}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(expense)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(expense.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
