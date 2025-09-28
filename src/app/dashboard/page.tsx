import { getProjects, getUsers } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Project, User } from "@/lib/data";
import CreateProjectButton from "@/components/dashboard/create-project-button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const projectsData = await getProjects();
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
    createdAt: p.createdAt,
  }));

  const users: User[] = usersData.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight font-headline">
            Projects
          </h2>
          <p className="text-muted-foreground">
            Your central hub for all ongoing and completed projects.
          </p>
        </div>
      </div>
      <ProjectList initialProjects={projects} users={users} />
    </div>
  );
}
