"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { approveJoinRequest, denyJoinRequest } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Project, User, Role } from '@/lib/data';
import { AlertCircle, Check, X, Bell } from 'lucide-react';
import { Badge } from '../ui/badge';

type ViewRequestsDialogProps = {
  projects: Project[];
  users: User[];
  requestCount: number;
};

type Request = {
    user: User;
    project: Project;
}

export default function ViewRequestsDialog({ projects, users, requestCount }: ViewRequestsDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('viewer');
  const { toast } = useToast();

  const allRequests: Request[] = projects.flatMap(project => 
    (project.joinRequests || [])
        .map(userId => {
            const user = users.find(u => u.id === userId);
            return user ? { user, project } : null;
        })
        .filter((r): r is Request => r !== null)
  );

  const handleApproveClick = (request: Request) => {
    setSelectedRequest(request);
    setSelectedRole('viewer');
    setApprovalDialogOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest) return;
    const { user, project } = selectedRequest;
    const result = await approveJoinRequest(project.id, user.id, selectedRole);
    if (result.success) {
      toast({ title: 'Success', description: `${user.name} has been added to ${project.name}.` });
      setApprovalDialogOpen(false);
      // Optimistically remove from list to update UI, full reload on dialog close
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };
  
  const handleDeny = async (request: Request) => {
    const { user, project } = request;
    const result = await denyJoinRequest(project.id, user.id);
    if (result.success) {
      toast({ title: 'Request Denied', description: `The request from ${user.name} has been denied.` });
       // Optimistically remove from list to update UI, full reload on dialog close
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  }

  return (
    <>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                    <Bell className="mr-2 h-4 w-4" />
                    View Requests
                    <Badge variant="destructive" className="absolute -right-2 -top-2 px-1.5 py-0.5 text-xs">{requestCount}</Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Pending Join Requests</DialogTitle>
                    <DialogDescription>
                        Review and manage user requests to join your projects.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {allRequests.length > 0 ? allRequests.map((request, idx) => (
                        <div key={`${request.project.id}-${request.user.id}-${idx}`} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={request.user.avatarUrl} alt={request.user.name} />
                                    <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{request.user.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Wants to join: <span className="font-medium text-foreground">{request.project.name}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={() => handleDeny(request)}>
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10 hover:text-green-600" onClick={() => handleApproveClick(request)}>
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-muted-foreground py-8">No pending requests.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
            <DialogContent className="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle>Approve Request & Assign Role</DialogTitle>
                <DialogDescription>
                    Assign a role to {selectedRequest?.user.name} for the project "{selectedRequest?.project.name}".
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
                <Button variant="secondary" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmApproval}>Approve and Add</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
