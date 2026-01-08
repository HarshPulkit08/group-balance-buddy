import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AddMemberDialogProps {
  onAdd: (name: string, email?: string) => Promise<boolean> | boolean;
}

export function AddMemberDialog({ onAdd }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await onAdd(name, email);
      if (success) {
        toast.success(`${name.trim()} added to the group`);
        setName('');
        setEmail('');
        setOpen(false);
      } else {
        toast.error('Member already exists');
      }
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <UserPlus className="w-4 h-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">Name</label>
            <Input
              placeholder="Enter name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
            <Input
              placeholder="user@example.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-xl h-11"
            />
            <p className="text-[10px] text-muted-foreground px-1">Adding an email allows this person to access the group from their own account.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !email.trim()}>
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
