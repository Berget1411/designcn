"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { CgFileDocument } from "react-icons/cg";
import { FaPlus } from "react-icons/fa6";
import { GoGitCommit } from "react-icons/go";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import useFormBuilderStore from "@/form-builder/hooks/use-form-builder-store";
import useLocalForms from "@/form-builder/hooks/use-local-forms";

export const NewForm = () => {
  const router = useRouter();
  const [formValue, setFormValue] = React.useState({ name: "", isMS: false });
  const setFormElements = useFormBuilderStore((s) => s.setFormElements);
  const setIsMs = useFormBuilderStore((s) => s.setIsMS);
  const initializeForm = useLocalForms((s) => s.initializeForm);
  const [open, setOpen] = React.useState(false);

  function handleSave(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!formValue.name) return;

    const newForm = initializeForm(formValue.name, { isMS: formValue.isMS });

    if (newForm) {
      router.push("/form-builder?id=" + newForm.id);
      setFormElements([], {
        isMS: formValue.isMS,
        id: newForm.id,
        name: newForm.name,
      });
      setIsMs(formValue.isMS);
    }

    setOpen(false);
    toast("Form created successfully");
    setFormValue({ name: "", isMS: false });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <FaPlus />
        </Button>
      </DialogTrigger>
      <DialogOverlay className="" />
      <DialogContent className="p-6 bg-glass">
        <DialogHeader>
          <DialogTitle>Create new form</DialogTitle>
        </DialogHeader>
        <div className="w-full pt-4">
          {/* <h1 className="text-2xl font-bold mb-4"></h1> */}
          <form onSubmit={handleSave} className="flex items-start justify-center flex-col gap-3">
            <Input
              placeholder="Form Name"
              value={formValue.name}
              onChange={(e) => setFormValue({ ...formValue, name: e.target.value })}
              required
            />
            <ToggleGroup
              type="single"
              value={formValue.isMS ? "multi" : "single"}
              onValueChange={(value) => setFormValue({ ...formValue, isMS: value === "multi" })}
              className="flex gap-1 rounded-none"
            >
              <ToggleGroupItem className="rounded-md px-2" value="single">
                <CgFileDocument className="size-4 text-secondary-foreground/50" />
                Simple Form
              </ToggleGroupItem>
              <ToggleGroupItem className="rounded-md px-4" value="multi">
                <GoGitCommit className="size-4 text-secondary-foreground/50" />
                Multi-step Form
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="w-full flex justify-end pt-2">
              <Button type="submit">Create new form</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
