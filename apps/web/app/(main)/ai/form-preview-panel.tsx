"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AiGeneratedForm } from "@workspace/forms";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { FileTree, FileTreeFile, FileTreeFolder } from "@/components/ai-elements/file-tree";
import { FormPreview } from "@/form-builder/components/preview/form-preview";
import { WebPreview } from "@/form-builder/components/web-preview";
import type { FormElement, FormElementOrList, FormStep } from "@/form-builder/form-types";
import { flattenFormSteps } from "@/form-builder/lib/form-elements-helpers";
import { genFormZodSchema } from "@/form-builder/lib/generate-zod-schema";
import { formatCode } from "@/form-builder/lib/utils";
import { cn } from "@/lib/utils";
import {
  EyeIcon,
  CodeIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { buildGeneratedFormFiles, toFormBuilderElements } from "./form-mode";

type PanelView = "preview" | "code";

interface FormPreviewPanelProps {
  form: AiGeneratedForm | null;
  isGenerating: boolean;
  isSaving: boolean;
  hasHydratedDrafts: boolean;
  savedDraftId: string | null;
  onClose: () => void;
  onSaveDraft: () => void;
  onNewForm: () => void;
}

function useGeneratedPreview(form: AiGeneratedForm | null) {
  const { formElements, isMS } = useMemo(
    () =>
      form
        ? toFormBuilderElements(form)
        : {
            formElements: [],
            isMS: false,
          },
    [form],
  );

  const flatFields = useMemo(
    () =>
      isMS
        ? flattenFormSteps(formElements as FormStep[]).flat()
        : (formElements as FormElementOrList[]).flat(),
    [formElements, isMS],
  );

  const editableFields = useMemo(
    () => (flatFields as FormElement[]).filter((field) => !("static" in field && field.static)),
    [flatFields],
  );

  const defaultValues = useMemo(
    () =>
      editableFields.reduce<Record<string, unknown>>((acc, field) => {
        acc[field.name] =
          (field as FormElement & { defaultValue?: unknown }).defaultValue ?? undefined;
        return acc;
      }, {}),
    [editableFields],
  );

  const schema = useMemo(() => genFormZodSchema(editableFields), [editableFields]);

  const previewForm = useForm({
    defaultValues,
    resolver: zodResolver(schema as never),
  });

  useEffect(() => {
    previewForm.reset(defaultValues);
  }, [defaultValues, form, previewForm]);

  return {
    formElements,
    isMS,
    previewForm,
  };
}

function FormCodeView({ form }: { form: AiGeneratedForm }) {
  const [selectedPath, setSelectedPath] = useState("components/generated-form.tsx");
  const [files, setFiles] = useState<Record<string, string>>({
    "components/generated-form.tsx": "",
    "lib/form-schema.ts": "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const rawFiles = buildGeneratedFormFiles(form);
      const formattedFiles = await Promise.all(
        rawFiles.map(async (file) => {
          try {
            return {
              file: file.file,
              code: await formatCode(file.code),
            };
          } catch {
            return file;
          }
        }),
      );

      if (!cancelled) {
        setFiles(Object.fromEntries(formattedFiles.map((file) => [file.file, file.code])));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [form]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b">
        <FileTree
          defaultExpanded={new Set(["components", "lib"])}
          onSelect={setSelectedPath}
          selectedPath={selectedPath}
          className="rounded-none border-0"
        >
          <FileTreeFolder name="components" path="components">
            <FileTreeFile name="generated-form.tsx" path="components/generated-form.tsx" />
          </FileTreeFolder>
          <FileTreeFolder name="lib" path="lib">
            <FileTreeFile name="form-schema.ts" path="lib/form-schema.ts" />
          </FileTreeFolder>
        </FileTree>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <CodeBlock
          code={files[selectedPath] ?? ""}
          language={selectedPath.endsWith(".ts") ? "ts" : "tsx"}
          showLineNumbers
          className="h-full rounded-none border-0"
        >
          <CodeBlockHeader>
            <CodeBlockTitle>{selectedPath}</CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton />
            </CodeBlockActions>
          </CodeBlockHeader>
        </CodeBlock>
      </div>
    </div>
  );
}

export function FormPreviewPanel({
  form,
  isGenerating,
  isSaving,
  hasHydratedDrafts,
  savedDraftId,
  onClose,
  onSaveDraft,
  onNewForm,
}: FormPreviewPanelProps) {
  const [view, setView] = useState<PanelView>("preview");
  const { formElements, isMS, previewForm } = useGeneratedPreview(form);

  const hasForm = !!form;
  const builderHref = savedDraftId ? `/form-builder?id=${savedDraftId}` : "#";
  const draftsHref = savedDraftId ? `/form-templates/${savedDraftId}` : "#";

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setView("preview")}
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors",
              view === "preview"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <EyeIcon className="size-3" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView("code")}
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors",
              view === "code"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CodeIcon className="size-3" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {hasForm && !savedDraftId && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={!hasHydratedDrafts || isSaving}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <SaveIcon className="size-3" />
              )}
              Save draft
            </button>
          )}
          {savedDraftId && (
            <>
              <Link
                href={builderHref}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLinkIcon className="size-3" />
                Open in builder
              </Link>
              <Link
                href={draftsHref}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLinkIcon className="size-3" />
                View in drafts
              </Link>
            </>
          )}
          {hasForm && (
            <button
              type="button"
              onClick={onNewForm}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <PlusIcon className="size-3" />
              New form
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {!hasForm ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium">Create a form draft</p>
              <p className="text-sm text-muted-foreground">
                Start a form conversation on the left and the live preview plus generated code will
                appear here.
              </p>
            </div>
          </div>
        ) : view === "preview" ? (
          <div className="h-full overflow-auto p-4">
            <WebPreview url="/ai/form-preview">
              <div className="p-1 md:p-3 lg:px-8 lg:py-6 @container/my-forms">
                <FormPreview
                  form={previewForm}
                  formElements={formElements as FormElementOrList[] | FormStep[]}
                  isMS={isMS}
                  className="bg-background squircle rounded-3xl"
                  onSubmit={async () => new Promise((resolve) => setTimeout(resolve, 300))}
                  submittedData={{}}
                  cleanEditingFields={() => {}}
                />
              </div>
            </WebPreview>
          </div>
        ) : (
          <FormCodeView form={form} />
        )}

        {isGenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Updating form draft...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
