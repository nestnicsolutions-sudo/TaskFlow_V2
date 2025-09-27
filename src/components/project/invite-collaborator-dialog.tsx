import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Project, User } from "@/lib/data";
import { inviteCollaborator } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type InviteCollaboratorDialogProps = {
    children: ReactNode;
    project: Project;
    users: User[];
    disabled?: boolean;
}

export default function InviteCollaboratorDialog({ children, project, users, disabled }: InviteCollaboratorDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("viewer");
    const { toast } = useToast();

    const availableUsers = users.filter(user => 
        user.id !== project.ownerId && !project.collaborators.some(c => c.userId === user.id)
    );
    
    const handleInvite = async () => {
        if (!selectedUser || !selectedRole) {
            toast({ title: "Error", description: "Please select a user and a role.", variant: "destructive" });
            return;
        }

        const result = await inviteCollaborator(project.id, selectedUser, selectedRole);
        if (result.success) {
            toast({ title: "Success", description: "Collaborator invited successfully." });
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message || "Failed to invite collaborator.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Collaborator</DialogTitle>
                    <DialogDescription>
                        Invite a registered user to collaborate on "{project.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="user" className="text-right">User</Label>
                        <Select onValueChange={setSelectedUser} value={selectedUser}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select onValueChange={(value) => setSelectedRole(value as "editor" | "viewer")} value={selectedRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleInvite}>Send Invite</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
