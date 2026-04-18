import { FormStudioShell } from "@/form-builder/components/form-studio-shell";

export default function FormTemplatesLayout({ children }: { children: React.ReactNode }) {
  return <FormStudioShell>{children}</FormStudioShell>;
}
