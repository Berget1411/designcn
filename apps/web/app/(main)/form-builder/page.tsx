"use client";

import * as React from "react";
import { FormBuilder } from "@/form-builder/components/form-builder";
import { FormStudioShell } from "@/form-builder/components/form-studio-shell";

export default function FormBuilderPage() {
  return (
    <React.Suspense fallback={null}>
      <FormStudioShell>
        <FormBuilder />
      </FormStudioShell>
    </React.Suspense>
  );
}
