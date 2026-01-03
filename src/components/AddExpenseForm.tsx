import { useState, useEffect } from 'react';
import { Member, Expense } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check } from 'lucide-react';

interface AddExpenseFormProps {
  members: Member[];
  editingExpense?: Expense | null;
  onAdd: (payerId: string, amount: number, note: string) => void;
  onEdit: (id: string, payerId: string, amount: number, note: string) => void;
  onCancelEdit: () => void;
}

export function AddExpenseForm({ members, editingExpense, onAdd, onEdit, onCancelEdit }: AddExpenseFormProps) {
  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setPayerId(editingExpense.payerId);
      setAmount(editingExpense.amount.toString());
      setNote(editingExpense.note);
    }
  }, [editingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!payerId || isNaN(amountNum) || amountNum <= 0) return;

    if (editingExpense) {
      onEdit(editingExpense.id, payerId, amountNum, note);
      onCancelEdit();
    } else {
      onAdd(payerId, amountNum, note);
    }

    setPayerId('');
    setAmount('');
    setNote('');
  };

  const handleCancel = () => {
    setPayerId('');
    setAmount('');
    setNote('');
    onCancelEdit();
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Add members first to record expenses
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={payerId} onValueChange={setPayerId}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Who paid?" />
          </SelectTrigger>
          <SelectContent>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="pl-7"
            step="0.01"
            min="0"
          />
        </div>
        <Input
          placeholder="What for?"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="flex-1"
        />
      </div>
      <div className="flex gap-2">
        <Button 
          type="submit" 
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={!payerId || !amount}
        >
          {editingExpense ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Update Expense
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </>
          )}
        </Button>
        {editingExpense && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
