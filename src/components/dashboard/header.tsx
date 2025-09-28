import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../theme-toggle";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import NotificationPopover from "./notification-popover";
import { getNotifications } from "@/app/actions";

export default async function Header({ user }: { user: { name?: string | null, email?: string | null, id: string, avatarUrl?: string | null }}) {
    const notifications = await getNotifications();
    
    return (
        <div className="flex w-full items-center gap-4 md:gap-2 lg:gap-4">
            <div className="flex-1" />
            <NotificationPopover notifications={notifications} />
            <ThemeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatarUrl || "https://picsum.photos/seed/101/100/100"} alt="User Avatar" />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <form action={logout} className="w-full">
                           <button type="submit" className="w-full text-left flex items-center">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                           </button>
                        </form>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
