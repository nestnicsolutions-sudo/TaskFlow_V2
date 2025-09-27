import { getProjects, getUsers } from "@/app/actions";
import ProjectList from "@/components/dashboard/project-list";
import { ObjectId } from "mongodb";

export default async function DashboardPage() {
    const projectsData = await getProjects();
    const usersData = await getUsers();

    // Convert ObjectId to string for client-side consumption
    const projects = projectsData.map(p => ({
        ...p,
        _id: p._id.toString(),
        ownerId: p.ownerId.toString(),
        collaborators: p.collaborators.map((c:any) => ({
            ...c,
            userId: c.userId.toString()
        }))
    }));
    
    const users = usersData.map(u => ({
        ...u,
        _id: u._id.toString(),
    }));

    return (
        <div className="container mx-auto">
            <ProjectList initialProjects={projects} users={users} />
        </div>
    );
}
