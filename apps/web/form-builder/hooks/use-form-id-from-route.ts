"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { templates } from "@/form-builder/constant/templates";

/**
 * Returns the current form ID from path params (form-templates) or search params (my-forms).
 * Prefers path-based routing for better SEO.
 */
export function useFormIdFromRoute() {
  const router = useRouter();
  const params = useParams<{ formTemplate?: string }>();
  const searchParams = useSearchParams();

  const formTemplateParam = params?.formTemplate;
  const searchId = searchParams?.get("id");

  // Path param when on form-templates; search param when on my-forms
  const formId = formTemplateParam ?? searchId ?? undefined;

  const navigateToForm = useCallback(
    (id: string) => {
      router.push("/form-templates/" + id);
    },
    [router],
  );

  return useMemo(() => ({ formId, navigateToForm }), [formId, navigateToForm]);
}

/**
 * Hook to get the default template for redirects
 */
export function useDefaultTemplateId() {
  return templates[0]?.id;
}
