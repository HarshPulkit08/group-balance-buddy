import { Group } from '@/types/expense';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Receipt, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityFeedProps {
    groups: Group[];
    userId: string;
    userEmail?: string | null;
}

export function ActivityFeed({ groups, userId, userEmail }: ActivityFeedProps) {
    const activities = groups.flatMap(group => {
        const userMember = group.members.find(m =>
            m.userId === userId || (userEmail && m.email === userEmail)
        );

        if (!userMember) return [];

        return (group.expenses || [])
            .filter(e =>
                e.payerId === userMember.id ||
                (e.type === 'settlement' && e.relatedMemberId === userMember.id)
            )
            .map(e => ({
                ...e,
                groupName: group.name,
                isPayer: e.payerId === userMember.id,
                date: e.createdAt instanceof Date ? e.createdAt : (e.createdAt as any).toDate?.() || new Date(e.createdAt)
            }));
    }).sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <Card className="rounded-[2rem] border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm overflow-hidden border-t border-white/10 h-full">
            <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    MY ACTIVITY
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <ScrollArea className="h-[400px] px-8 pb-8">
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No recent activity.</p>
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'settlement'
                                                ? activity.isPayer ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                                : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {activity.type === 'settlement' ? (
                                                activity.isPayer ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />
                                            ) : (
                                                <Receipt className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">
                                                {activity.note || (activity.type === 'settlement' ? 'Settlement' : 'Expense')}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                <span>{format(activity.date, 'MMM d, h:mm a')}</span>
                                                <span>•</span>
                                                <span className="uppercase tracking-wider">{activity.groupName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-black text-sm ${activity.isPayer ? 'text-destructive' : 'text-green-600'
                                        }`}>
                                        {activity.isPayer ? '-' : '+'}₹{activity.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
