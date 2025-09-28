"use client";

import { useState, Dispatch } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { approveJoinRequest, denyJoinRequest } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Project, User, Role } from '@/lib/data';
import { AlertCircle, Check, X } from 'lucide-react';

type JoinRequestsProps = {
  project: Project;
  users: User[];
  dispatch: Dispatch<any>;
};

export default function JoinRequests({ project, users, dispatch }: JoinRequestsProps) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('viewer');
  const { toast } = useToast();

  const requestUsers = project.joinRequests?.map(userId => users.find(u => u.id === userId)).filter(Boolean) as User[] || [];

  if (requestUsers.length === 0) {
    return null;
  }

  const handleApproveClick = (user: User) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedUser) return;
    const result = await approveJoinRequest(project.id, selectedUser.id, selectedRole);
    if (result.success && result.project) {
      toast({ title: 'Success', description: `${selectedUser.name} has been added to the project.` });
      dispatch({ type: 'SET_PROJECT', payload: result.project });
      setOpen(false);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };
  
  const handleDeny = async (userId: string) => {
    const result = await denyJoinRequest(project.id, userId);
    if (result.success && result.project) {
        toast({ title: 'Request Denied', description: 'The join request has been denied.' });
        dispatch({ type: 'SET_PROJECT', payload: result.project });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  }

  return (
    <>
        <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardHeader className="pb-4 pt-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Pending Join Requests
                </CardTitle>
                <CardDescription className="text-xs">
                    The following users want to join your project. Approve or deny their requests.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                    {requestUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={() => handleDeny(user.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10 hover:text-green-600" onClick={() => handleApproveClick(user)}>
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Approve Request & Assign Role</DialogTitle>
                <DialogDescription>
                Assign a role to {selectedUser?.name} for the project "{project.name}".
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select onValueChange={(value) => setSelectedRole(value as Role)} value={selectedRole}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmApproval}>Approve and Add</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
