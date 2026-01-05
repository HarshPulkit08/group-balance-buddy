import { useState, useMemo } from 'react';
import { useExpenseSplitter } from '@/hooks/useExpenseSplitter';
import { useAuth } from '@/components/AuthContext';
import { MemberCard } from '@/components/MemberCard';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { SettlementCard } from '@/components/SettlementCard';
import { SpendingChart } from '@/components/SpendingChart';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Users, Receipt, TrendingUp, ArrowRightLeft, LogOut, Loader2, ChevronLeft, CheckCircle2, Calendar, IndianRupee } from 'lucide-react';
import { Expense } from '@/types/expense';
import { toast } from 'sonner';
import { MonthlyStats } from '@/components/MonthlyStats';
import { useGroups } from '@/hooks/useGroups';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';

const Index = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    resetMonth,
    loading
  } = useExpenseSplitter(id);

  const { groups, updateGroupStatus } = useGroups();
  const currentGroup = groups.find(g => g.id === id);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const tripStats = useMemo(() => {
    const now = new Date();
    const thisMonthTotal = expenses
      .filter(e => isSameMonth(new Date(e.createdAt), now))
      .reduce((sum, e) => sum + e.amount, 0);

    const userBalance = balances.find(b =>
      b.userId === user?.uid ||
      b.name === user?.email ||
      b.name.toLowerCase() === (user?.email?.split('@')[0].toLowerCase() ?? '')
    )?.balance || 0;

    return { thisMonthTotal, userBalance };
  }, [expenses, balances, user]);

  const handleSettleAll = async () => {
    if (confirm('Are you sure you want to mark this entire trip as settled?')) {
      try {
        await updateGroupStatus(id!, true);
        toast.success('Trip marked as settled!');
      } catch (error) {
        toast.error('Failed to settle trip');
      }
    }
  };

  const handleSettleMonth = async () => {
    if (confirm('Are you sure you want to settle this month? This will clear current expenses and save them to history.')) {
      try {
        await resetMonth();
        toast.success('Month settled! Starting fresh.');
      } catch (error) {
        toast.error('Failed to settle month');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleRemoveMember = async (mid: string) => {
    const member = members.find(m => m.id === mid);
    await removeMember(mid);
    if (member) {
      toast.success(`${member.name} removed from the group`);
    }
  };

  const handleAddExpense = async (payerId: string, amount: number, note: string, receiptUrl?: string) => {
    await addExpense(payerId, amount, note, receiptUrl);
    toast.success('Expense added');
  };

  const handleEditExpense = async (eid: string, payerId: string, amount: number, note: string, receiptUrl?: string) => {
    await editExpense(eid, payerId, amount, note, receiptUrl);
    toast.success('Expense updated');
    setEditingExpense(null);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleRemoveExpense = async (eid: string) => {
    await removeExpense(eid);
    toast.success('Expense deleted');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading trip details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/95 pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-1 rounded-full hover:bg-primary/10">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-foreground max-w-[200px] md:max-w-md truncate">
                  {currentGroup?.name || 'Trip Details'}
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {currentGroup && format(currentGroup.createdAt, 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!currentGroup?.isSettled && (
                <>
                  {currentGroup.type === 'household' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSettleMonth}
                      className="hidden md:flex gap-2 border-primary/20 text-primary hover:bg-primary/10 rounded-full h-9"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Settle Month
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSettleAll}
                      className="hidden md:flex gap-2 border-green-200 text-green-700 hover:bg-green-50 rounded-full h-9"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Close Trip
                    </Button>
                  )}
                </>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive rounded-full">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Members */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden border-t border-white/10">
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  FRIENDS
                </CardTitle>
                <CardDescription className="font-medium">Managing {members.length} people</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8">
                <div className="space-y-3">
                  {balances.map(member => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </div>
                {members.length === 0 && (
                  <div className="bg-muted/30 rounded-2xl p-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">No one here yet.</p>
                  </div>
                )}
                <AddMemberDialog onAdd={addMember} />
              </CardContent>
            </Card>
          </div>

          {/* Center - Expenses */}
          <div className="lg:col-span-5 space-y-6">
            {/* Summary Insight Card */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-3xl bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 p-5 group hover:scale-[1.02] transition-transform">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Trip Total</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-2xl font-black">₹{totalSpent.toLocaleString()}</span>
                </div>
              </Card>
              <Card className="rounded-3xl bg-card border-none shadow-xl shadow-black/5 p-5 group hover:scale-[1.02] transition-transform border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Balance</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className={`text-2xl font-black ${tripStats.userBalance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {tripStats.userBalance >= 0 ? '+' : ''}₹{Math.abs(tripStats.userBalance).toLocaleString()}
                  </span>
                </div>
              </Card>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-sm p-6 sm:p-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-8">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  EXPENSES
                </CardTitle>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {expenses.length} TOTAL
                </div>
              </div>

              <AddExpenseForm
                members={members}
                editingExpense={editingExpense}
                onAdd={handleAddExpense}
                onEdit={handleEditExpense}
                onCancel={handleCancelEdit}
              />

              <div className="mt-10">
                <ExpenseList
                  expenses={expenses}
                  members={members}
                  onEdit={setEditingExpense}
                  onRemove={handleRemoveExpense}
                />
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Analytics */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden border-t border-white/10">
              <Tabs defaultValue="settle" className="w-full">
                <CardHeader className="pb-0 pt-8 px-8 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-black uppercase tracking-tighter">INSIGHTS</CardTitle>
                </CardHeader>
                <div className="px-8 pb-4 border-b border-border/50 mt-4">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1 rounded-2xl h-11">
                    <TabsTrigger value="settle" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      SETTLE
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      <TrendingUp className="w-3.5 h-3.5" />
                      MONTHLY
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      <Users className="w-3.5 h-3.5" />
                      SPLIT
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardContent className="pt-8 px-8 pb-8">
                  <TabsContent value="settle" className="mt-0 outline-none">
                    <div className="space-y-4">
                      <SettlementCard settlements={settlements} />
                      {currentGroup?.isSettled && (
                        <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-600 animate-in fade-in zoom-in duration-500">
                          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase tracking-wider">Settled</p>
                            <p className="text-xs font-semibold opacity-80">This journey is complete!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="stats" className="mt-0 outline-none">
                    <MonthlyStats expenses={expenses} />
                  </TabsContent>
                  <TabsContent value="chart" className="mt-0 outline-none">
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
