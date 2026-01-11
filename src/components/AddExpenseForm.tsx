import { useState, useEffect } from 'react';
import { Member, Expense } from '@/types/expense';
import { useCurrency } from '@/components/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AddExpenseFormProps {
  members: Member[];
  editingExpense?: Expense | null;
  onAdd: (payerId: string, amount: number, note: string, receiptUrl?: string, splitType?: 'equal' | 'unequal', splits?: Record<string, number>) => Promise<void>;
  onEdit: (id: string, payerId: string, amount: number, note: string, receiptUrl?: string, splitType?: 'equal' | 'unequal', splits?: Record<string, number>) => Promise<void>;
  onCancel: () => void;
  budget?: number;
  currentTotal?: number;
}

export function AddExpenseForm({ members, editingExpense, onAdd, onEdit, onCancel, budget, currentTotal }: AddExpenseFormProps) {
  const { currency } = useCurrency();
  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal');
  const [splits, setSplits] = useState<Record<string, number>>({});

  // Initialize splits when members change or mode changes to unequal
  useEffect(() => {
    if (splitType === 'unequal' && Object.keys(splits).length === 0 && members.length > 0) {
      const initialSplits: Record<string, number> = {};
      members.forEach(m => initialSplits[m.id] = 0);
      setSplits(initialSplits);
    }
  }, [splitType, members]);

  useEffect(() => {
    if (editingExpense) {
      setPayerId(editingExpense.payerId);
      setAmount(editingExpense.amount.toString());
      setNote(editingExpense.note);
      setReceiptPreview(editingExpense.receiptUrl || null);
      setSplitType(editingExpense.splitType || 'equal');
      setSplits(editingExpense.splits || {});
    } else {
      setPayerId('');
      setAmount('');
      setNote('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setSplitType('equal');
      setSplits({});
    }
  }, [editingExpense]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!payerId || isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    if (splitType === 'unequal') {
      const totalSplit = Object.values(splits).reduce((sum, val) => sum + (val || 0), 0);
      // Allow a small epsilon for floating point errors
      if (Math.abs(totalSplit - amountNum) > 0.05) {
        toast.error(`Split amounts (${totalSplit}) must equal the total expense (${amountNum})`);
        return;
      }
    }

    // Budget Warning Check
    if (budget && currentTotal !== undefined) {
      const projectedTotal = currentTotal + amountNum - (editingExpense ? editingExpense.amount : 0);
      if (projectedTotal > budget) {
        toast.warning('Warning: This expense exceeds the group budget!', {
          duration: 5000,
          icon: '⚠️'
        });
      }
    }

    setIsSubmitting(true);
    try {
      let receiptUrl = receiptPreview || undefined;

      if (receiptFile) {
        const storageRef = ref(storage, `receipts/${crypto.randomUUID()}-${receiptFile.name}`);
        const snapshot = await uploadBytes(storageRef, receiptFile);
        receiptUrl = await getDownloadURL(snapshot.ref);
      } else if (editingExpense && !receiptPreview) {
        receiptUrl = undefined;
      }

      if (editingExpense) {
        await onEdit(editingExpense.id, payerId, amountNum, note, receiptUrl, splitType, splitType === 'unequal' ? splits : undefined);
      } else {
        await onAdd(payerId, amountNum, note, receiptUrl, splitType, splitType === 'unequal' ? splits : undefined);
      }

      setPayerId('');
      setAmount('');
      setNote('');
      clearReceipt();
      setSplitType('equal');
      setSplits({});
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast.error('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    setPayerId('');
    setAmount('');
    setNote('');
    clearReceipt();
    setSplitType('equal');
    setSplits({});
    onCancel();
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currency}</span>
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

      {/* Split Type Selector */}
      <div className="bg-muted/30 p-1 rounded-lg flex gap-1">
        <Button
          type="button"
          variant={splitType === 'equal' ? 'secondary' : 'ghost'}
          className={`flex-1 h-8 text-xs font-bold ${splitType === 'equal' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
          onClick={() => setSplitType('equal')}
        >
          Equal Split
        </Button>
        <Button
          type="button"
          variant={splitType === 'unequal' ? 'secondary' : 'ghost'}
          className={`flex-1 h-8 text-xs font-bold ${splitType === 'unequal' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
          onClick={() => setSplitType('unequal')}
        >
          Unequal Split
        </Button>
      </div>

      {/* Unequal Split Inputs */}
      {splitType === 'unequal' && (
        <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Specify how much each person owes:</p>
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium flex-1 truncate">{member.name}</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currency}</span>
                <Input
                  type="number"
                  value={splits[member.id] || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setSplits(prev => ({ ...prev, [member.id]: val }));
                  }}
                  className="h-8 pl-5 text-right text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
          <div className="pt-2 flex justify-between items-center text-xs font-bold border-t border-border/10 mt-2">
            <span className="text-muted-foreground">Total Entered:</span>
            <span className={`${Math.abs((Object.values(splits).reduce((a, b) => a + (b || 0), 0)) - (parseFloat(amount) || 0)) < 0.05 ? 'text-green-600' : 'text-destructive'}`}>
              {currency}{Object.values(splits).reduce((a, b) => a + (b || 0), 0).toFixed(2)} / {currency}{amount || '0'}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground ml-1">Receipt (Optional)</label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              className="border-dashed h-24 w-24 flex flex-col gap-2 rounded-2xl shrink-0 overflow-hidden"
              onClick={() => document.getElementById('receipt-upload')?.click()}
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs">Add Image</span>
            </Button>
            <input
              id="receipt-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {receiptPreview && (
              <div className="relative h-24 w-24 rounded-2xl overflow-hidden border bg-muted">
                <img src={receiptPreview} alt="Receipt" className="h-full w-full object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full"
                  onClick={clearReceipt}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={!payerId || !amount || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : editingExpense ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? (editingExpense ? 'Updating...' : 'Adding...') : editingExpense ? 'Update Expense' : 'Add Expense'}
          </Button>
          {editingExpense && (
            <Button type="button" variant="outline" onClick={handleCancelClick}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
