import { getProjects, getUsers } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";
import type { Project, User } from "@/lib/data";
import CreateProjectButton from "@/components/dashboard/create-project-button";
import JoinProjectDialog from "@/components/dashboard/join-project-dialog";
import ViewRequestsDialog from "@/components/dashboard/view-requests-dialog";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  const currentUser = session.user as User;

  const projectsData = await getProjects(currentUser.id);
  const usersData = await getUsers();
  
  const projects: Project[] = projectsData.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    ownerId: p.ownerId,
    collaborators: p.collaborators.map((c: any) => ({
      userId: c.userId,
      role: c.role,
    })),
    joinRequests: p.joinRequests || [],
    createdAt: p.createdAt,
  }));

  const users: User[] = usersData.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  }));
  
  const projectsOwned = projects.filter(p => p.ownerId === currentUser.id);
  const totalJoinRequests = projectsOwned.reduce((acc, p) => acc + (p.joinRequests?.length || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 -mt-4 px-4 pt-4 pb-2 border-b">
        <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight font-headline">
                Projects
            </h2>
            <p className="text-muted-foreground">
                Your central hub for all ongoing and completed projects.
            </p>
            </div>
            <div className="flex items-center gap-2">
              {totalJoinRequests > 0 && (
                <ViewRequestsDialog projects={projectsOwned} users={users} requestCount={totalJoinRequests} />
              )}
              <JoinProjectDialog />
              <CreateProjectButton />
            </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto -mx-4 px-4">
        <ProjectList initialProjects={projects} users={users} currentUserId={currentUser.id} />
      </div>
    </div>
  );
}
