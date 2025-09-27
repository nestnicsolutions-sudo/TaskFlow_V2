import { getProjects, getUsers } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";
import CreateProjectForm from "@/components/dashboard/create-project-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Project, User } from "@/lib/data";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const projectsData = await getProjects();
  const usersData = await getUsers();

  // Convert data to plain objects for client-side consumption
  const projects: Project[] = projectsData.map((p) => ({
    id: p.id.toString(),
    name: p.name,
    description: p.description,
    ownerId: p.ownerId.toString(),
    collaborators: p.collaborators.map((c: any) => ({
      userId: c.userId.toString(),
      role: c.role,
    })),
    createdAt: p.createdAt,
  }));

  const users: User[] = usersData.map((u) => ({
    id: u.id.toString(),
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  }));

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight font-headline">
            Projects
          </h2>
          <p className="text-muted-foreground">
            Your central hub for all ongoing and completed projects.
          </p>
        </div>
        <CreateProjectForm userId={session.user.id} />
      </div>
      <ProjectList initialProjects={projects} users={users} />
    </div>
  );
}
