import type { ReactNode } from "react";
import Link from "next/link";
import { FolderKanban, LogOut, Settings } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import Header from "@/components/dashboard/header";
import Logo from "@/components/logo";
import { getProjects } from "@/app/actions";
import { getSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }
    
    const projects = await getProjects();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <Sidebar>
                    <SidebarHeader>
                        <div className="flex items-center gap-2 p-2">
                            <Logo className="w-8 h-8 text-primary" />
                            <span className="font-bold text-lg whitespace-nowrap group-data-[collapsible=icon]:hidden">Nestnic TaskFlow</span>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                 <SidebarMenuButton asChild tooltip="Projects">
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
                                    <SidebarMenuButton asChild tooltip={project.name} size="sm">
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
                                    <SidebarMenuButton type="submit" className="w-full" tooltip="Logout">
                                        <LogOut />
                                        <span>Logout</span>
                                     </SidebarMenuButton>
                                 </form>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
                <div className="flex flex-col flex-1">
                    <Header user={session.user}/>
                    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
