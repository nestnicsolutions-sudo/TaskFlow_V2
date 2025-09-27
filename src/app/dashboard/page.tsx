import { getProjects, getUsers } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";

export default async function DashboardPage() {
    const projects = await getProjects();
    const users = await getUsers();

    return (
        <div className="container mx-auto">
            <ProjectList initialProjects={projects} users={users} />
        </div>
    );
}
