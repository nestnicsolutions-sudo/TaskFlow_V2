"use client";

import type { Project, User } from "@/lib/data";
import ViewRequestsDialog from "@/components/dashboard/view-requests-dialog";
import JoinProjectDialog from "@/components/dashboard/join-project-dialog";
import CreateProjectButton from "@/components/dashboard/create-project-button";

type ProjectActionsProps = {
  projectsOwned: Project[];
  users: User[];
  totalJoinRequests: number;
};

export default function ProjectActions({
  projectsOwned,
  users,
  totalJoinRequests,
}: ProjectActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {totalJoinrequests > 0 && (
        <ViewRequestsDialog
          projects={projectsOwned}
          users={users}
          requestCount={totalJoinRequests}
        />
      )}
      <JoinProjectDialog />
      <CreateProjectButton />
    </div>
  );
}
