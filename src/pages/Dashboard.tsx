import { useState, useMemo } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, Plus, Trash2, ArrowRight, Loader2, Calendar, TrendingUp, Users, Receipt, CheckCircle2, Home, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { groups, loading, createGroup, deleteGroup } = useGroups();
    const [newGroupName, setNewGroupName] = useState('');
    const [groupType, setGroupType] = useState<'trip' | 'household'>('trip');
    const [isCreating, setIsCreating] = useState(false);
    const [open, setOpen] = useState(false);

    const stats = useMemo(() => {
        const now = new Date();
        let totalPaidByUser = 0;

        groups.forEach(group => {
            const userMember = group.members?.find(m =>
                m.userId === user?.uid ||
                (user?.email && m.email === user.email)
            );

            if (userMember) {
                const groupNet = (group.expenses || [])
                    .filter(e => isSameMonth(new Date(e.createdAt), now))
                    .reduce((net, e) => {
                        // Add amount if user paid (Expense or Settlement)
                        if (e.payerId === userMember.id) {
                            return net + e.amount;
                        }
                        // Subtract amount if user received a settlement
                        if (e.type === 'settlement' && e.relatedMemberId === userMember.id) {
                            return net - e.amount;
                        }
                        return net;
                    }, 0);

                totalPaidByUser += groupNet;
            }
        });

        const activeTrips = groups.filter(g => !g.isSettled && g.type === 'trip').length;
        const activeHouseholds = groups.filter(g => !g.isSettled && g.type === 'household').length;
        const totalGroups = groups.length;

        return { totalThisMonth: totalPaidByUser, activeTrips, activeHouseholds, totalGroups };
    }, [groups, user]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setIsCreating(true);
        try {
            await createGroup(newGroupName, '', groupType);
            toast.success(groupType === 'trip' ? 'New trip created!' : 'New household created!');
            setNewGroupName('');
            setGroupType('trip');
            setOpen(false);
        } catch (error) {
            toast.error('Failed to create group');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteGroup = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this group? All data will be lost.')) {
            try {
                await deleteGroup(id);
                toast.success('Group deleted');
            } catch (error) {
                toast.error('Failed to delete group');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                        <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Loading your groups...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background/95 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <header className="border-b border-border bg-card/40 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
                                <Wallet className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">SplitEase</h1>
                                <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">Logout</Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 relative z-10">
                {/* Global Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/10 shadow-sm overflow-hidden group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform origin-left">₹{stats.totalThisMonth.toLocaleString()}</h2>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Your personal spendings</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Plane className="w-4 h-4 text-primary" />
                                Trips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-3xl font-bold">{stats.activeTrips}</h2>
                            <p className="text-xs text-muted-foreground mt-1">Ongoing trip splits</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Home className="w-4 h-4 text-primary" />
                                Household
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-3xl font-bold">{stats.activeHouseholds}</h2>
                            <p className="text-xs text-muted-foreground mt-1">Active flat shares</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Total Groups
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-3xl font-bold">{stats.totalGroups}</h2>
                            <p className="text-xs text-muted-foreground mt-1">All time clusters</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/30 border-none shadow-none flex flex-col justify-center items-center py-6 sm:col-span-2 lg:col-span-1">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-full w-full max-w-[200px] rounded-2xl gap-2 shadow-xl shadow-primary/20 border-t border-white/10 group">
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    <span className="font-bold">New Group</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Start a new group</DialogTitle>
                                    <CardDescription>Create a trip or a shared household.</CardDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                                    <Tabs value={groupType} onValueChange={(v) => setGroupType(v as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 h-11 p-1 mb-4 rounded-xl">
                                            <TabsTrigger value="trip" className="gap-2 rounded-lg font-bold">
                                                <Plane className="w-4 h-4" /> Trip
                                            </TabsTrigger>
                                            <TabsTrigger value="household" className="gap-2 rounded-lg font-bold">
                                                <Home className="w-4 h-4" /> Household
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder={groupType === 'trip' ? "e.g. Manali 2026 ✈️" : "e.g. Flat 303 🏠"}
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            className="h-12 rounded-xl border-2 focus-visible:ring-primary/20"
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isCreating || !newGroupName.trim()}>
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {groupType === 'trip' ? 'Launch Trip' : 'Create Household'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </Card>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Your Groups</h2>
                        <p className="text-sm text-muted-foreground">Select a group to manage expenses</p>
                    </div>
                </div>

                {groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 bg-card/40 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-muted transition-all hover:bg-card/60">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Get Started!</h3>
                        <p className="text-muted-foreground text-center max-w-xs mb-8">
                            You haven't created any groups yet. Start your first group or trip to begin splitting expenses.
                        </p>
                        <Button onClick={() => setOpen(true)} className="rounded-full px-8 h-12 text-lg shadow-lg shadow-primary/20">
                            Create first group
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((group) => (
                            <Link key={group.id} to={`/trip/${group.id}`} className="group block h-full">
                                <Card className="h-full border-none bg-card hover:bg-card/80 shadow-md hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden flex flex-col relative active:scale-95 group-hover:-translate-y-1 border-t border-white/10">
                                    {group.isSettled && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <div className="bg-green-500/10 backdrop-blur-md text-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-500/20">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Settled
                                            </div>
                                        </div>
                                    )}
                                    <CardHeader className="pb-2 pt-8 px-8">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors pr-8 min-h-[3rem] line-clamp-2">
                                                {group.name}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="flex items-center gap-2 mt-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                            {format(group.createdAt, 'MMMM d, yyyy')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-6 pt-2 px-8 flex-1">
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="bg-muted/40 p-3 rounded-2xl flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                    <Users className="w-3 h-3" />
                                                    People
                                                </div>
                                                <p className="text-xl font-black mt-1">{group.members?.length || 0}</p>
                                            </div>
                                            <div className="bg-muted/40 p-3 rounded-2xl flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                    <Receipt className="w-3 h-3" />
                                                    Expenses
                                                </div>
                                                <p className="text-xl font-black mt-1">{group.expenses?.length || 0}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 pb-8 px-8 flex justify-between items-center text-primary font-bold text-sm">
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                            Manage group <ArrowRight className="w-4 h-4" />
                                        </div>
                                        {group.createdBy === user?.uid && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all opacity-0 group-hover:opacity-100 rounded-full h-8 w-8 ml-auto"
                                                onClick={(e) => handleDeleteGroup(e, group.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
