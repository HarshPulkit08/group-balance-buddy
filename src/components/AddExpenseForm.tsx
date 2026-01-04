import { useState, useEffect } from 'react';
import { Member, Expense } from '@/types/expense';
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
  onAdd: (payerId: string, amount: number, note: string, receiptUrl?: string) => Promise<void>;
  onEdit: (id: string, payerId: string, amount: number, note: string, receiptUrl?: string) => Promise<void>;
  onCancel: () => void;
}

export function AddExpenseForm({ members, editingExpense, onAdd, onEdit, onCancel }: AddExpenseFormProps) {
  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    if (editingExpense) {
      setPayerId(editingExpense.payerId);
      setAmount(editingExpense.amount.toString());
      setNote(editingExpense.note);
      setReceiptPreview(editingExpense.receiptUrl || null);
    } else {
      setPayerId('');
      setAmount('');
      setNote('');
      setReceiptFile(null);
      setReceiptPreview(null);
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
        await onEdit(editingExpense.id, payerId, amountNum, note, receiptUrl);
      } else {
        await onAdd(payerId, amountNum, note, receiptUrl);
      }

      setPayerId('');
      setAmount('');
      setNote('');
      clearReceipt();
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
