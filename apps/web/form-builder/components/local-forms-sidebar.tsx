"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { CgFileDocument } from "react-icons/cg";
import { GoGitCommit } from "react-icons/go";
import { Button } from "@workspace/ui/components/button";
import { SidebarWrapper } from "@/form-builder/components/sidebar-wrapper";
import { LocalFormsMenu } from "@/form-builder/components/local-forms-menu";
import { templates } from "@/form-builder/constant/templates";
import { useFormIdFromRoute } from "@/form-builder/hooks/use-form-id-from-route";
import useLocalForms from "@/form-builder/hooks/use-local-forms";
import { NewForm } from "./new-form";

export function LocalFormsSidebar() {
  const allForms = useLocalForms((s) => s.forms);
  const { formId, navigateToForm } = useFormIdFromRoute();
  const router = useRouter();
  const defaultTemplateId = templates[0]?.id;

  React.useEffect(() => {
    if (!formId && defaultTemplateId) {
      router.push("/form-templates/" + defaultTemplateId);
    }
  }, [defaultTemplateId, formId, router]);

  function setQueryState(id: string) {
    navigateToForm(id);
  }

  return (
    <SidebarWrapper menu={<LocalFormsMenu className="w-full" />} headerAction={<NewForm />}>
      <div className="flex flex-col gap-4">
        {allForms.length > 0 && (
          <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-3">
            <p className="px-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Drafts
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {allForms.map((savedForm) => (
                <Button
                  key={savedForm.id}
                  onClick={() => setQueryState(savedForm.id)}
                  className="justify-start rounded-2xl px-3 py-2.5 text-sm @container/form-button"
                  variant={formId === savedForm.id ? "secondary" : "ghost"}
                >
                  <div className="flex gap-2 items-center @xs/form-button:max-w-[100px] max-w-[190px]">
                    {savedForm.isMS ? (
                      <GoGitCommit className="size-4 text-secondary-foreground/50" />
                    ) : (
                      <CgFileDocument className="size-4 text-secondary-foreground/50" />
                    )}
                    <span className="truncate">{savedForm.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-3">
          <p className="px-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Templates
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {templates.map(({ id, title, isMS }) => (
              <Button
                key={id}
                onClick={() => setQueryState(id)}
                className="justify-start rounded-2xl px-3 py-2.5 text-sm"
                variant={formId === id ? "secondary" : "ghost"}
              >
                {isMS ? (
                  <GoGitCommit className="size-4 text-secondary-foreground/50" />
                ) : (
                  <CgFileDocument className="size-4 text-secondary-foreground/50" />
                )}
                {title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </SidebarWrapper>
  );
}
