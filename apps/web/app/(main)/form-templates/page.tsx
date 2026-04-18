import { redirect } from "next/navigation";
import { templates } from "@/form-builder/constant/templates";

export default function FormTemplatesIndexPage() {
  const defaultTemplateId = templates[0]?.id;

  if (!defaultTemplateId) {
    return null;
  }

  redirect("/form-templates/" + defaultTemplateId);
}
