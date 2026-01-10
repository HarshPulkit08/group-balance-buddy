import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Group } from '@/types/expense';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, Award, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { isSameMonth } from 'date-fns';

interface GlobalStatsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: Group[];
    userId?: string;
    userEmail?: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b'];

export function GlobalStatsDialog({ open, onOpenChange, groups, userId, userEmail }: GlobalStatsDialogProps) {
    if (!userId) return null;

    const now = new Date();
    // Calculate generic stats
    let totalSpent = 0;
    let totalThisMonth = 0;
    const spendingByGroup = groups.map(group => {
        // Find current user in this group
        const member = group.members.find(m =>
            m.userId === userId ||
            (userEmail && m.email === userEmail) ||
            (userEmail && m.name.toLowerCase() === userEmail.split('@')[0].toLowerCase())
        );

        if (!member) return { name: group.name, value: 0 };

        // Calculate direct expenses + settlements paid by user
        const expensesPaid = (group.expenses || [])
            .filter(e => e.payerId === member.id)
            .reduce((sum, e) => sum + e.amount, 0);

        // Calculate this month (Expenses + Settlements)
        const expensesThisMonth = (group.expenses || [])
            .filter(e => e.payerId === member.id && isSameMonth(new Date(e.createdAt), now))
            .reduce((sum, e) => sum + e.amount, 0);

        totalSpent += expensesPaid;
        totalThisMonth += expensesThisMonth;
        return {
            name: group.name,
            value: expensesPaid
        };
    }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

    const topGroup = spendingByGroup.length > 0 ? spendingByGroup[0] : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl rounded-[2rem] bg-card/95 backdrop-blur-xl border-none shadow-2xl">
                <DialogHeader className="pb-4 border-b border-border/50">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        Spending Overview
                    </DialogTitle>
                    <DialogDescription className="break-words">
                        Breakdown of where you've spent your money across all {groups.length} groups.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Charts Section */}
                    <div className="min-h-[300px] flex flex-col items-center justify-center p-4 bg-muted/20 rounded-3xl border border-white/5">
                        {spendingByGroup.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={spendingByGroup}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {spendingByGroup.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <p>No expense data available.</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Distribution by Group (All Time)</p>
                    </div>

                    {/* Stats Cards Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="rounded-2xl border-none bg-gradient-to-br from-primary/10 to-primary/5 shadow-none sm:col-span-2">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/20 rounded-full">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                        </div>
                                        <p className="font-bold text-muted-foreground text-sm uppercase tracking-wide">Total Spent</p>
                                    </div>
                                    <p className="text-4xl font-black text-foreground">₹{totalSpent.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground mt-1">All time across all groups</p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-none bg-muted/40 shadow-none">
                                <CardContent className="p-4">
                                    <div className="p-2 bg-green-500/10 rounded-full w-fit mb-3">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </div>
                                    <p className="font-bold text-muted-foreground text-xs uppercase mb-1">This Month</p>
                                    <p className="text-2xl font-black">₹{totalThisMonth.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="rounded-2xl border-none bg-muted/40 shadow-none">
                                <CardContent className="p-4">
                                    <div className="p-2 bg-orange-500/10 rounded-full w-fit mb-3">
                                        <Award className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <p className="font-bold text-muted-foreground text-xs uppercase mb-1">Top Group</p>
                                    <p className="text-lg font-bold truncate" title={topGroup?.name || '-'}>
                                        {topGroup?.name || '-'}
                                    </p>
                                    {topGroup && <p className="text-xs font-medium text-orange-600">₹{topGroup.value.toLocaleString()}</p>}
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-none bg-muted/40 shadow-none">
                                <CardContent className="p-4">
                                    <div className="p-2 bg-blue-500/10 rounded-full w-fit mb-3">
                                        <Layers className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <p className="font-bold text-muted-foreground text-xs uppercase mb-1">Active Groups</p>
                                    <p className="text-lg font-bold">{groups.filter(g => !g.isSettled).length}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
