"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Check, LoaderCircle } from "lucide-react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BsFillSendFill } from "react-icons/bs";
import { HiOutlineCodeBracket } from "react-icons/hi2";
import { MdOutlineEditOff } from "react-icons/md";
import { toast } from "sonner";

import { ErrorFallback } from "@/components/shared/error-fallback";
import { FormEdit } from "@/form-builder/components/edit/form-edit";
import { FormBuilderMenu } from "@/form-builder/components/form-builder-menu";
import { FormElementsSelectCommand } from "@/form-builder/components/form-elements-select-command";
import { FormElementsSidebar } from "@/form-builder/components/form-elements-sidebar";
import { CodePanel, JsonViewer } from "@/form-builder/components/generated-code/code-panel";
import { Placeholder } from "@/form-builder/components/placeholder";
import { FormPreview } from "@/form-builder/components/preview/form-preview";
import { SidebarWrapper } from "@/form-builder/components/sidebar-wrapper";
import { CommandProvider } from "@/form-builder/hooks/use-command-ctx";
import useFormBuilderStore from "@/form-builder/hooks/use-form-builder-store";
import { usePreviewForm } from "@/form-builder/hooks/use-preview-form";
import { templates } from "../constant/templates";
import type { FormElementOrList } from "../form-types";
import useLocalForms from "../hooks/use-local-forms";
import { flattenFormElementOrList } from "../lib/form-elements-helpers";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

const editTab = "Edit";
const codeTab = "Code";
const submissionTab = "Submission";

const tabsList = [
  {
    name: editTab,
    icon: <MdOutlineEditOff />,
  },
  {
    name: codeTab,
    icon: <HiOutlineCodeBracket />,
  },
  {
    name: submissionTab,
    icon: <BsFillSendFill />,
  },
];

const PatternBG = () => (
  <div
    className="absolute inset-0 -z-10 opacity-20"
    style={{
      backgroundImage: `
        repeating-linear-gradient(45deg, 
          var(--border) 0px, 
          var(--border) 2px, 
          transparent 2px, 
          transparent 5px
        )
      `,
    }}
  />
);

function FormRenderFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorFallback
      error={
        error instanceof Error ? error : new Error("Something went wrong while rendering the form.")
      }
      resetErrorBoundary={resetErrorBoundary}
    />
  );
}

export function FormBuilder() {
  const previewForm = usePreviewForm();
  const { submittedData, cleanEditingFields: resetForm } = previewForm;
  const formElements = useFormBuilderStore((s) => s.formElements);
  const setFormElements = useFormBuilderStore((s) => s.setFormElements);
  const meta = useFormBuilderStore((s) => s.meta);
  const isMS = useFormBuilderStore((s) => s.isMS);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const allForms = useLocalForms((s) => s.forms);
  const hasLocalFormsHydrated = useLocalForms((s) => s.hasHydrated);
  const saveForm = useLocalForms((s) => s.updateForm);
  const setForm = useLocalForms((s) => s.setForm);
  const defaultTemplateId = templates[0]?.id;
  const savedForm = React.useMemo(() => allForms.find((form) => form.id === id), [allForms, id]);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle");
  const saveStateTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const flattenElements = flattenFormElementOrList(formElements as FormElementOrList[]);
    if (flattenElements) {
      setFormElements(flattenElements, {
        id: meta.id,
        name: meta.name,
        isMS,
      });
    }
  }, []);

  React.useEffect(() => {
    if (!id || !hasLocalFormsHydrated || !savedForm || meta.id === savedForm.id) {
      return;
    }

    const normalizedFormElements = savedForm.isMS
      ? savedForm.formElements
      : (flattenFormElementOrList(savedForm.formElements as FormElementOrList[]) ??
        savedForm.formElements);

    setFormElements(normalizedFormElements, {
      id: savedForm.id,
      name: savedForm.name,
      isMS: savedForm.isMS,
    });
  }, [hasLocalFormsHydrated, id, meta.id, savedForm, setFormElements]);

  React.useEffect(() => {
    if (!id && defaultTemplateId) {
      router.push("/form-templates/" + defaultTemplateId);
    }
  }, [defaultTemplateId, id, router]);

  React.useEffect(() => {
    return () => {
      if (saveStateTimeoutRef.current) {
        window.clearTimeout(saveStateTimeoutRef.current);
      }
    };
  }, []);

  function persistForm() {
    if (!id) {
      return;
    }

    const now = new Date().toISOString();
    const name = meta.name || savedForm?.name || "Untitled Form";

    if (savedForm) {
      saveForm({ id, name, formElements });
    } else {
      setForm({
        id,
        name,
        formElements,
        createdAt: now,
        updatedAt: now,
        isMS,
      });
    }
  }

  function handleSaveForm() {
    if (!id || !hasLocalFormsHydrated || saveState === "saving") {
      return;
    }

    setSaveState("saving");

    window.setTimeout(() => {
      persistForm();
      setSaveState("saved");
      toast.success("Form changes saved locally", { duration: 1000 });

      if (saveStateTimeoutRef.current) {
        window.clearTimeout(saveStateTimeoutRef.current);
      }

      saveStateTimeoutRef.current = window.setTimeout(() => {
        setSaveState("idle");
      }, 1500);
    }, 0);
  }

  if (!id) {
    return null;
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 gap-(--gap) lg:grid-cols-[minmax(18rem,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <div className="h-full min-h-0">
          <CommandProvider>
            <SidebarWrapper menu={<FormBuilderMenu className="w-full" />}>
              <FormElementsSelectCommand />
              <FormElementsSidebar />
            </SidebarWrapper>
          </CommandProvider>
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-border/60 bg-background/80 shadow-xl ring-1 ring-foreground/5 backdrop-blur-xl">
          <PatternBG />
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background/70 to-transparent" />
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="grid min-h-full gap-4 p-3 md:p-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-5">
              <Card className="min-w-0 rounded-[1.75rem] border border-border/70 bg-card/88 py-0 shadow-none ring-0 backdrop-blur-sm">
                <Tabs defaultValue={editTab} className="min-h-0 bg-transparent">
                  <div className="border-b border-border/60 px-3 py-3 md:px-4">
                    <TabsList className="h-auto w-full rounded-2xl bg-muted/70 p-1">
                      {tabsList.map((tab) => (
                        <TabsTrigger
                          key={tab.name}
                          value={tab.name}
                          className="w-full rounded-xl py-2 dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-background"
                        >
                          {tab.icon}
                          {tab.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  <CardContent className="min-h-0 px-0">
                    <TabsContent value={editTab} tabIndex={-1} className="p-3 md:p-4">
                      {formElements.length > 0 ? (
                        <ErrorBoundary FallbackComponent={FormRenderFallback}>
                          <div className="pt-2">
                            <FormEdit />
                            <div className="flex items-center justify-between pt-4">
                              {formElements.length > 1 && (
                                <Button variant="ghost" onClick={resetForm}>
                                  Remove All
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                onClick={handleSaveForm}
                                disabled={
                                  Boolean(id) && (!hasLocalFormsHydrated || saveState === "saving")
                                }
                              >
                                {saveState === "saving" ? (
                                  <>
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : saveState === "saved" ? (
                                  <>
                                    <Check className="size-4" />
                                    Saved
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            </div>
                          </div>
                        </ErrorBoundary>
                      ) : (
                        <div>
                          <Placeholder className="max-w-full rounded-lg border p-10">
                            Add fields first from the left sidebar or use{" "}
                            <KbdGroup>
                              <Kbd>Alt</Kbd>+<Kbd>f</Kbd>
                            </KbdGroup>{" "}
                            to open the command palette
                          </Placeholder>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value={codeTab} tabIndex={-1} className="p-3 md:p-4">
                      <ErrorBoundary FallbackComponent={FormRenderFallback}>
                        <CodePanel />
                      </ErrorBoundary>
                    </TabsContent>
                    <TabsContent value={submissionTab} tabIndex={-1} className="p-3 md:p-4">
                      {Object.keys(submittedData).length > 0 ? (
                        <JsonViewer json={submittedData} isMS={isMS} />
                      ) : (
                        <Placeholder className="max-w-full rounded-lg border p-10">
                          Fill out the form to see fields values
                        </Placeholder>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
              <div className="min-w-0 pb-3 lg:pb-0">
                <div className="lg:sticky lg:top-4">
                  <div className="rounded-[1.75rem] border border-border/70 bg-background/85 p-2 shadow-lg ring-1 ring-foreground/5 backdrop-blur-sm md:p-3">
                    <ErrorBoundary FallbackComponent={FormRenderFallback}>
                      <FormPreview {...previewForm} formElements={formElements} isMS={isMS} />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
