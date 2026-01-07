import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Member } from '@/types/expense';
import { toast } from 'sonner';
import { UserCog } from 'lucide-react';

interface MemberDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    member: Member | null;
    onUpdate: (id: string, data: Partial<Member>) => Promise<void>;
}

export function MemberDetailsDialog({ isOpen, onClose, member, onUpdate }: MemberDetailsDialogProps) {
    const [name, setName] = useState('');
    const [upiId, setUpiId] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (member) {
            setName(member.name);
            setUpiId(member.upiId || '');
            setEmail(member.email || '');
        }
    }, [member]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member || !name.trim()) return;

        setLoading(true);
        try {
            await onUpdate(member.id, {
                name: name.trim(),
                upiId: upiId.trim() || undefined,
                email: email.trim() || undefined
            });
            toast.success('Member details updated');
            onClose();
        } catch (error) {
            toast.error('Failed to update details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-primary" />
                        Edit Member
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="rounded-xl border-border/50 bg-muted/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="upi">UPI ID (e.g., name@okicici)</Label>
                        <Input
                            id="upi"
                            placeholder="username@upi"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                            className="rounded-xl border-border/50 bg-muted/30 font-mono text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium">
                            Used to generate payment links for settlements.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="rounded-xl border-border/50 bg-muted/30"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium">
                            Linking an email allows cross-device access for this member.
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || loading} className="rounded-xl font-bold shadow-lg shadow-primary/20">
                            {loading ? 'Saving...' : 'Save Details'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
