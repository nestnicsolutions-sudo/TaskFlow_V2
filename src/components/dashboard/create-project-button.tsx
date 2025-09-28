 "use client";

import { useState } from "react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateProjectForm from "./create-project-form";

export default function CreateProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <CreateProjectForm open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
    </CreateProjectForm>
  );
}
