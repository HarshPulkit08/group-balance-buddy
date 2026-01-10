import { useState, useEffect } from 'react';
import { Group, Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coins, AlertTriangle, TrendingUp, Settings2 } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useCurrency } from '@/components/CurrencyContext';
import { toast } from 'sonner';

interface BudgetOverviewProps {
    group: Group;
    expenses: Expense[];
}

export function BudgetOverview({ group, expenses }: BudgetOverviewProps) {
    const { currency } = useCurrency();
    const { updateGroupBudget } = useGroups();
    const [budgetInput, setBudgetInput] = useState(group.budget?.toString() || '');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter expenses for current month only
    const currentMonthExpenses = expenses.filter(e => {
        const now = new Date();
        const expenseDate = new Date(e.createdAt);
        return expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear() &&
            e.type !== 'settlement'; // Exclude settlements
    });

    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = group.budget || 0;
    const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
    const isOverBudget = budget > 0 && totalSpent > budget;
    const isNearBudget = budget > 0 && totalSpent > budget * 0.9;

    const handleSaveBudget = async () => {
        const value = parseFloat(budgetInput);
        if (isNaN(value) || value < 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        setLoading(true);
        try {
            await updateGroupBudget(group.id, value);
            toast.success('Group budget updated');
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('Failed to update budget');
        } finally {
            setLoading(false);
        }
    };

    // Color logic for progress bar
    let progressColor = "bg-primary";
    if (isOverBudget) progressColor = "bg-destructive";
    else if (isNearBudget) progressColor = "bg-yellow-500";

    return (
        <Card className="border-border/50 shadow-sm mb-6 overflow-hidden">
            <div className={`h-1.5 w-full ${isOverBudget ? 'bg-destructive/20' : 'bg-primary/10'}`}>
                <div
                    className={`h-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" />
                    Monthly Budget
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <Settings2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>Set Monthly Budget</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Budget Limit ({currency})</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={budgetInput}
                                    onChange={(e) => setBudgetInput(e.target.value)}
                                    className="rounded-xl"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Set a target for monthly household spending.
                                </p>
                            </div>
                            <Button onClick={handleSaveBudget} disabled={loading} className="w-full rounded-xl font-bold">
                                {loading ? 'Saving...' : 'Save Budget'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-3xl font-black">{currency}{totalSpent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                            Spent this month
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-muted-foreground">
                            Target: {budget > 0 ? `${currency}${budget.toLocaleString()}` : 'Not Set'}
                        </p>
                        {budget > 0 && (
                            <p className={`text-xs font-bold ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
                                {isOverBudget
                                    ? `${(totalSpent - budget).toLocaleString()} over`
                                    : `${(budget - totalSpent).toLocaleString()} remaining`}
                            </p>
                        )}
                    </div>
                </div>

                {isOverBudget && (
                    <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-2 bg-destructive/20 rounded-full">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-destructive">Budget Exceeded!</p>
                            <p className="text-xs text-destructive/80 mt-0.5">
                                You've spent more than the allocated budget of {currency}{budget.toLocaleString()}.
                            </p>
                        </div>
                    </div>
                )}

                {budget === 0 && (
                    <div className="mt-4 p-3 bg-muted/40 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Set a budget to track spending and save more.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
