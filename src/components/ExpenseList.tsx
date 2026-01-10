import { Expense, Member } from '@/types/expense';
import { useCurrency } from '@/components/CurrencyContext';
import { Receipt, Pencil, Trash2, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onEdit: (expense: Expense) => void;
  onRemove: (id: string) => void;
}

export function ExpenseList({ expenses, members, onEdit, onRemove }: ExpenseListProps) {
  const { currency } = useCurrency();
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

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

  // Group expenses by date
  const groupedExpenses = expenses.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).reduce((groups: { [key: string]: Expense[] }, expense) => {
    const date = startOfDay(expense.createdAt).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedExpenses).map(([dateStr, items]) => (
        <div key={dateStr}>
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider tabular-nums">
              {formatDateHeader(dateStr)}
            </h3>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <div className="space-y-3">
            {items.map((expense, index) => (
              <div
                key={expense.id}
                className="group flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-slide-up"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold shrink-0 border border-primary/10">
                  {getMemberName(expense.payerId).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {getMemberName(expense.payerId)}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">paid</span>
                    <span className="font-black text-primary">{currency}{expense.amount.toLocaleString()}</span>
                  </div>
                  {expense.note && (
                    <p className="text-sm text-muted-foreground/80 font-medium truncate mt-0.5">{expense.note}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      {format(expense.createdAt, 'h:mm a')}
                    </p>
                    {expense.receiptUrl && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 uppercase tracking-widest transition-colors"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Receipt
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-black/95 border-none p-0 overflow-hidden rounded-[2rem]">
                          <div className="relative group/img">
                            <img
                              src={expense.receiptUrl}
                              alt="Receipt"
                              className="w-full h-auto max-h-[80vh] object-contain"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                              <ZoomIn className="w-10 h-10 text-white" />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    onClick={() => onEdit(expense)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                    onClick={() => onRemove(expense.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
