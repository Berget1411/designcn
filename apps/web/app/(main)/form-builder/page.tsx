"use client";

import { FormBuilder } from "@/form-builder/components/form-builder";
import { FormStudioShell } from "@/form-builder/components/form-studio-shell";

export default function FormBuilderPage() {
  return (
    <FormStudioShell>
      <FormBuilder />
    </FormStudioShell>
  );
}
