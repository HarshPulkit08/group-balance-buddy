import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Member, Settlement } from '@/types/expense';
import { CreditCard, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';

import { toast } from 'sonner';

interface SettleDebtDialogProps {
    isOpen: boolean;
    onClose: () => void;
    debtor: Member | null;
    settlements: Settlement[];
    creditors: Member[]; // Full member objects to get UPI IDs
    onSettle: (payerId: string, receiverId: string, amount: number) => Promise<void>;
}

export function SettleDebtDialog({ isOpen, onClose, debtor, settlements, creditors, onSettle }: SettleDebtDialogProps) {
    const [loading, setLoading] = useState<string | null>(null);

    if (!debtor) return null;

    // Find who this debtor owes
    const debts = settlements.filter(s => s.fromId === debtor.id);

    const handleSettle = async (debt: Settlement) => {
        setLoading(debt.toId);
        await onSettle(debt.fromId, debt.toId, debt.amount);
        setLoading(null);
        if (debts.length <= 1) {
            onClose();
        }
    };

    const getUpiLink = (creditorId: string, amount: number) => {
        const creditor = creditors.find(c => c.id === creditorId);
        if (!creditor?.upiId) return null;
        // Basic UPI deep link format
        return `upi://pay?pa=${creditor.upiId}&pn=${encodeURIComponent(creditor.name)}&am=${amount}&cu=INR`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        Settle Debts
                    </DialogTitle>
                    <p className="text-muted-foreground font-medium">Recorded payments for <span className="text-foreground font-bold">{debtor.name}</span></p>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {debts.length === 0 ? (
                        <div className="p-6 bg-green-500/10 rounded-2xl flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mb-2">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-green-600 font-bold text-lg">All Settled!</p>
                            <p className="text-green-600/80 text-sm">{debtor.name} doesn't owe anything right now.</p>
                        </div>
                    ) : (
                        debts.map((debt) => {
                            const upiLink = getUpiLink(debt.toId, debt.amount);
                            const creditor = creditors.find(c => c.id === debt.toId);
                            const hasUpi = !!creditor?.upiId;

                            return (
                                <div key={debt.toId} className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Owes to</p>
                                            <p className="text-lg font-bold">{debt.to}</p>
                                            {!hasUpi && <p className="text-[10px] text-destructive font-semibold">No UPI ID set</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                                            <p className="text-xl font-black text-debt">₹{debt.amount}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {hasUpi ? (
                                            <Button
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 rounded-xl font-bold"
                                                asChild
                                            >
                                                <a href={upiLink!} target="_blank" rel="noopener noreferrer">
                                                    Pay via UPI <ArrowRight className="w-4 h-4 ml-1" />
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button
                                                className="flex-1 bg-muted text-muted-foreground rounded-xl font-bold cursor-not-allowed"
                                                disabled
                                            >
                                                UPI Unavailable
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            className="flex-1 border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-bold"
                                            onClick={() => handleSettle(debt)}
                                            disabled={loading === debt.toId}
                                        >
                                            {loading === debt.toId ? 'Processing...' : 'Mark Paid'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
