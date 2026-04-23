"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash, X } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { BsStars } from "react-icons/bs";
import { toast } from "sonner";

import { templates } from "@/form-builder/constant/templates";
import { useFormIdFromRoute } from "@/form-builder/hooks/use-form-id-from-route";
import { useLocalForms } from "@/form-builder/hooks/use-local-forms";
import { usePreviewForm } from "@/form-builder/hooks/use-preview-form";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import type { FormElementOrList } from "../form-types";
import useFormBuilderStore from "../hooks/use-form-builder-store";
import { flattenFormElementOrList } from "../lib/form-elements-helpers";
import { LocalFormsSidebar } from "./local-forms-sidebar";
import { FormPreview } from "./preview/form-preview";
import { WebPreview } from "./web-preview";

function DeleteButtonWithConfim({ cb }: { cb: () => void }) {
  const [open, setOpen] = React.useState(false);

  return open ? (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        onClick={() => {
          cb();
          setOpen(false);
        }}
      >
        Confirm
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button variant="destructive" onClick={() => setOpen(true)}>
      <Trash className="size-4" />
      Delete form
    </Button>
  );
}

function SavedFormCard(props: { name: string; id: string }) {
  const updateForm = useLocalForms((s) => s.updateForm);
  const deleteForm = useLocalForms((s) => s.deleteForm);
  const defaultTemplateId = templates[0]?.id;
  const [editMode, setEditMode] = React.useState(false);
  const [name, setName] = React.useState(props.name);
  const router = useRouter();

  React.useEffect(() => {
    setEditMode(false);
    setName(props.name);
  }, [props.id, props.name]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditMode(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleEdit() {
    updateForm({ id: props.id, name });
    setEditMode(false);
  }

  function handleDelete() {
    deleteForm(props.id);
    toast("Form deleted successfully");
    if (defaultTemplateId) {
      router.push("/form-templates/" + defaultTemplateId);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {editMode ? (
        <div className="flex w-full items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background dark:bg-background"
          />
          <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
            <X className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit()}>
            <Check className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Saved draft
          </p>
          <h2
            className="mt-1 truncate text-base font-semibold hover:cursor-pointer"
            onClick={() => setEditMode(true)}
          >
            {name}
          </h2>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <DeleteButtonWithConfim cb={handleDelete} />
        <Button variant="outline" onClick={() => setEditMode(true)}>
          <Pencil className="size-4" />
          Rename
        </Button>
      </div>
    </div>
  );
}

const useMigrateLocalForms = () => {
  const forms = useLocalForms((s) => s.forms);
  const updateForm = useLocalForms((s) => s.updateForm);

  React.useEffect(() => {
    forms.forEach((form) => {
      const flattenElements = flattenFormElementOrList(form.formElements as FormElementOrList[]);
      if (flattenElements) {
        updateForm({ id: form.id, formElements: flattenElements });
      }
    });
  }, []);

  return {};
};

const useSelectedForm = () => {
  const { formId: PreviewFormId } = useFormIdFromRoute();
  const getFormById = useLocalForms((s) => s.getFormById);

  const isSelectedFormTemplate = !!PreviewFormId && PreviewFormId.startsWith("template-");

  const selectedForm = isSelectedFormTemplate
    ? templates.find((t) => t.id === PreviewFormId)
    : getFormById(PreviewFormId!);

  return { selectedForm, PreviewFormId, isSelectedFormTemplate };
};

export function MyForms() {
  useMigrateLocalForms();
  const previewForm = usePreviewForm();
  const setFormElements = useFormBuilderStore((s) => s.setFormElements);
  const setForm = useLocalForms((s) => s.setForm);
  const getFormById = useLocalForms((s) => s.getFormById);
  const updateForm = useLocalForms((s) => s.updateForm);

  const { selectedForm, PreviewFormId, isSelectedFormTemplate } = useSelectedForm();
  const meta = useFormBuilderStore((s) => s.meta);
  const formElements = useFormBuilderStore((s) => s.formElements);
  const router = useRouter();
  const defaultTemplateId = templates[0]?.id;
  const selectedFormName = selectedForm
    ? "title" in selectedForm
      ? selectedForm.title
      : selectedForm.name
    : "Form";

  React.useEffect(() => {
    if (PreviewFormId && !selectedForm && defaultTemplateId) {
      router.replace("/form-templates/" + defaultTemplateId);
    }
  }, [PreviewFormId, defaultTemplateId, selectedForm, router]);

  React.useEffect(() => {
    previewForm.form.reset();
  }, [PreviewFormId]);

  function handleUseForm() {
    toast.message("Redirecting...", { duration: 1000 });

    if (meta.id) {
      updateForm({
        id: meta.id,
        formElements: formElements,
      });
    }

    if (isSelectedFormTemplate) {
      const template = templates.find((t) => t.id === PreviewFormId);
      if (template) {
        const id = crypto.randomUUID();
        const date = new Date().toISOString();
        const formObject = {
          id,
          name: template.title + " Template",
          isMS: template.isMS,
          formElements: template.formElements as FormElementOrList[],
          createdAt: date,
          updatedAt: date,
        };

        setFormElements(formObject.formElements, {
          isMS: formObject.isMS,
          id,
          name: formObject.name,
        });
        setForm(formObject);
        router.push("/form-builder?id=" + id);
        return;
      }
    } else {
      const savedForm = getFormById(PreviewFormId!);
      if (savedForm) {
        setFormElements(savedForm.formElements, {
          isMS: savedForm.isMS,
          id: savedForm.id,
          name: savedForm.name,
        });
      }
      router.push("/form-builder?id=" + PreviewFormId);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 gap-(--gap) lg:grid-cols-[minmax(18rem,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
      <div className="hidden h-full min-h-0 lg:block">
        <LocalFormsSidebar />
      </div>
      <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-border/60 bg-background/80 shadow-xl ring-1 ring-foreground/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-linear-to-br from-background/90 via-background/70 to-surface/70" />
        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <div className="flex flex-col gap-4 border-b border-border/60 bg-background/45 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Form studio
              </p>
              <h1 className="mt-1 text-lg font-semibold text-balance">{selectedFormName}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {isSelectedFormTemplate
                  ? "Preview the template, then clone it into the builder when you are ready to customize it."
                  : "Review this saved draft, rename it, or jump back into the builder to keep iterating."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/ai?mode=form">
                <Button variant="default" className="rounded-xl">
                  <BsStars />
                  AI Form Generator
                </Button>
              </Link>
              <Button onClick={handleUseForm} variant="secondary" className="rounded-xl">
                {isSelectedFormTemplate ? "Clone template" : "Edit form"}
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-3 md:p-4 lg:p-6">
              {PreviewFormId && (
                <>
                  <WebPreview>
                    <div className="p-1 md:p-3 lg:px-8 lg:py-6 @container/my-forms">
                      <motion.div
                        key={PreviewFormId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "keyframes", duration: 0.35 }}
                      >
                        <FormPreview
                          formElements={(selectedForm?.formElements ?? []) as FormElementOrList[]}
                          isMS={selectedForm?.isMS || false}
                          className="bg-background squircle rounded-3xl"
                          {...previewForm}
                        />
                      </motion.div>
                    </div>
                  </WebPreview>
                  {!isSelectedFormTemplate && (
                    <div className="rounded-[1.5rem] border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur-sm">
                      <SavedFormCard
                        id={PreviewFormId}
                        name={getFormById(PreviewFormId)?.name || "Form"}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
