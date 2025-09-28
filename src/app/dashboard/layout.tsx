import type { ReactNode } from "react";
import Link from "next/link";
import { FolderKanban, LogOut, Settings } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import Header from "@/components/dashboard/header";
import Logo from "@/components/logo";
import { getProjects } from "@/app/actions";
import { getSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }
    
    const projects = await getProjects();

    const sidebarContent = (
        <>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Logo className="w-8 h-8 text-primary" />
                    <span className="font-bold text-lg whitespace-nowrap">Nestnic TaskFlow</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                         <SidebarMenuButton asChild>
                            <Link href="/dashboard">
                                <FolderKanban />
                                <span>Projects</span>
                            </Link>
                         </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu className="mt-4">
                    {projects.map(project => (
                         <SidebarMenuItem key={project.id}>
                            <SidebarMenuButton asChild size="sm">
                                <Link href={`/dashboard/projects/${project.id}`}>
                                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                                    <span>{project.name}</span>
                                </Link>
                            </SidebarMenuButton>
                         </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                     <SidebarMenuItem>
                         <form action={logout}>
                            <SidebarMenuButton type="submit" className="w-full">
                                <LogOut />
                                <span>Logout</span>
                             </SidebarMenuButton>
                         </form>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    );

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[300px_1fr]">
            <aside className="hidden border-r bg-muted/40 lg:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    {sidebarContent}
                </div>
            </aside>
            <div className="flex flex-col">
                 <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                           {sidebarContent}
                        </SheetContent>
                    </Sheet>
                    <Header user={session.user}/>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
