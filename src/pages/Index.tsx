import { useState } from 'react';
import { useExpenseSplitter } from '@/hooks/useExpenseSplitter';
import { MemberCard } from '@/components/MemberCard';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { SettlementCard } from '@/components/SettlementCard';
import { SpendingChart } from '@/components/SpendingChart';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Users, Receipt, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { Expense } from '@/types/expense';
import { toast } from 'sonner';

const Index = () => {
  const {
    members,
    expenses,
    balances,
    settlements,
    totalSpent,
    spendingByMember,
    addMember,
    removeMember,
    addExpense,
    editExpense,
    removeExpense,
  } = useExpenseSplitter();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleRemoveMember = (id: string) => {
    const member = members.find(m => m.id === id);
    removeMember(id);
    if (member) {
      toast.success(`${member.name} removed from the group`);
    }
  };

  const handleAddExpense = (payerId: string, amount: number, note: string) => {
    addExpense(payerId, amount, note);
    toast.success('Expense added');
  };

  const handleEditExpense = (id: string, payerId: string, amount: number, note: string) => {
    editExpense(id, payerId, amount, note);
    toast.success('Expense updated');
  };

  const handleRemoveExpense = (id: string) => {
    removeExpense(id);
    toast.success('Expense deleted');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SplitEase</h1>
                <p className="text-xs text-muted-foreground">Split expenses effortlessly</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Members</p>
                <p className="text-lg font-semibold text-foreground">{members.length}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Total Spent</p>
                <p className="text-lg font-semibold text-primary">₹{totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Members */}
          <div className="lg:col-span-3">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {balances.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onRemove={handleRemoveMember}
                  />
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members yet. Add someone to get started!
                  </p>
                )}
                <AddMemberDialog onAdd={addMember} />
              </CardContent>
            </Card>
          </div>

          {/* Center - Expenses */}
          <div className="lg:col-span-5">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Expenses ({expenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddExpenseForm
                  members={members}
                  editingExpense={editingExpense}
                  onAdd={handleAddExpense}
                  onEdit={handleEditExpense}
                  onCancelEdit={() => setEditingExpense(null)}
                />
                <div className="mt-6">
                  <ExpenseList
                    expenses={expenses}
                    members={members}
                    onEdit={setEditingExpense}
                    onRemove={handleRemoveExpense}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Settlements & Chart */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-card">
              <Tabs defaultValue="settle" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="settle" className="gap-2">
                      <ArrowRightLeft className="w-4 h-4" />
                      Settle Up
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Chart
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  <TabsContent value="settle" className="mt-0">
                    <SettlementCard settlements={settlements} />
                  </TabsContent>
                  <TabsContent value="chart" className="mt-0">
                    <SpendingChart data={spendingByMember} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
