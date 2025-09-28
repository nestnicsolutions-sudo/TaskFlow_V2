import { ReactNode, useState, Dispatch } from "react";
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
import { Input } from "../ui/input";
import { Copy } from "lucide-react";
import { Separator } from "../ui/separator";

type InviteCollaboratorDialogProps = {
    children: ReactNode;
    project: Project;
    users: User[];
    dispatch: Dispatch<any>;
    disabled?: boolean;
}

export default function InviteCollaboratorDialog({ children, project, users, dispatch, disabled }: InviteCollaboratorDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("viewer");
    const [copied, setCopied] = useState(false);
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
        if (result.success && result.project) {
            toast({ title: "Success", description: "Collaborator invited successfully." });
            dispatch({ type: 'SET_PROJECT', payload: result.project });
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message || "Failed to invite collaborator.", variant: "destructive" });
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(project.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite & Share</DialogTitle>
                    <DialogDescription>
                        Share the project ID or invite a registered user to collaborate on "{project.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="projectId">Project ID</Label>
                        <div className="flex items-center gap-2">
                            <Input id="projectId" value={project.id} readOnly className="bg-secondary" />
                            <Button variant="outline" size="icon" onClick={handleCopy}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        {copied && <p className="text-xs text-green-600">Copied to clipboard!</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>

                    <div className="space-y-2">
                        <Label>Invite a user directly</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                            <Select onValueChange={setSelectedUser} value={selectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUsers.length > 0 ? availableUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                                    )) : <p className="p-2 text-xs text-muted-foreground">No new users to invite.</p>}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={(value) => setSelectedRole(value as "editor" | "viewer")} value={selectedRole}>
                                <SelectTrigger className="w-full sm:w-[100px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleInvite} disabled={!selectedUser}>Send Invite</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
