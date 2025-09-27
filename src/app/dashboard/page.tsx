import { getProjects, getUsers } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";
import CreateProjectForm from "@/components/dashboard/create-project-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const projectsData = await getProjects();
  const usersData = await getUsers();

  // Convert ObjectId to string for client-side consumption
  const projects = projectsData.map((p) => ({
    ...p,
    _id: p._id.toString(),
    ownerId: p.ownerId.toString(),
    collaborators: p.collaborators.map((c: any) => ({
      ...c,
      userId: c.userId.toString(),
    })),
  }));

  const users = usersData.map((u) => ({
    ...u,
    _id: u._id.toString(),
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
