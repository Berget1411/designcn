import { z } from "zod";

const socialKeys = [
  "facebook",
  "twitter",
  "linkedin",
  "instagram",
  "github",
  "google",
  "discord",
  "youtube",
] as const;

const InputFieldSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Input"),
    type: z.enum(["text", "number", "email", "password", "tel"]).default("text"),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("Input element with type text, number, email, password, or tel");

const passwordSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Password"),
    type: z.literal("password").optional().default("password"),
    required: z.boolean(),
    placeholder: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("Password input");

const otpSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("OTP"),
    required: z.boolean(),
    placeholder: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("One time password input");

const textareaSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Textarea"),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("Textarea element");

const optionsSchema = z
  .array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  )
  .min(2)
  .default([
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
  ]);

const selectSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Select"),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    options: optionsSchema,
    width: z.string().optional(),
  })
  .describe("Use it when you want to let users select one from a list.");

const comboboxSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Combobox"),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    options: optionsSchema,
    width: z.string().optional(),
  })
  .describe("Use it for longer lists to select one from a list.");

const multiSelectSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("MultiSelect"),
    required: z.boolean().optional(),
    placeholder: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    options: optionsSchema,
    width: z.string().optional(),
  })
  .describe("Use it when you want to let users select one or multiple options from a list.");

const sliderSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Slider"),
    required: z.boolean().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional().default(1),
    width: z.string().optional(),
  })
  .describe("Slider element with min, max, and step, default value should be the middle value");

const toggleGroupSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("ToggleGroup"),
    required: z.boolean().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    options: optionsSchema,
    type: z.enum(["single", "multiple"]).optional().default("single"),
    width: z.string().optional(),
  })
  .describe("Toggle group element with options to toggle between one or multiple options");

const checkboxSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Checkbox"),
    required: z.boolean().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("Checkbox element");

const radioSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("RadioGroup"),
    required: z.boolean().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    options: optionsSchema,
    width: z.string().optional(),
  })
  .describe("RadioGroup element with options");

const switchSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    fieldType: z.literal("Switch"),
    required: z.boolean().optional(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("Switch element");

const ratingSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    description: z.string().optional(),
    numberOfStars: z.number().optional().default(5),
    fieldType: z.literal("Rating"),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("Rating element with number of stars");

const datePickerSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    name: z.string(),
    mode: z
      .enum(["single", "range", "multiple"])
      .default("single")
      .describe(
        "single mode is for single date selection, range mode is for date range selection, multiple mode is for multiple date selection",
      ),
    fieldType: z.literal("DatePicker"),
    required: z.boolean().optional(),
    placeholder: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().optional(),
    width: z.string().optional(),
  })
  .describe("DatePicker element");

const staticPropertySchema = z.literal(true).nonoptional();

const h1Schema = z
  .object({
    id: z.string(),
    static: staticPropertySchema,
    name: z.string(),
    fieldType: z.literal("Text"),
    variant: z.literal("H1"),
    content: z.string().min(2),
    width: z.string().optional(),
  })
  .describe("use it as a top title");

const h2Schema = z
  .object({
    id: z.string(),
    static: staticPropertySchema,
    name: z.string().min(2),
    fieldType: z.literal("Text"),
    variant: z.literal("H2"),
    content: z.string().min(2),
    width: z.string().optional(),
  })
  .describe("use it as a title form sections");

const h3Schema = z
  .object({
    id: z.string(),
    static: staticPropertySchema,
    name: z.string().min(2),
    fieldType: z.literal("Text"),
    variant: z.literal("H3"),
    content: z.string().min(2),
    width: z.string().optional(),
  })
  .describe("use it as a title for nested form sections");

const paragraphSchema = z
  .object({
    id: z.string(),
    static: staticPropertySchema,
    name: z.string().min(2),
    fieldType: z.literal("Text"),
    variant: z.literal("P"),
    content: z.string().min(2),
    width: z.string().optional(),
  })
  .describe("Paragraph element use for description, subtitle, etc.");

const separatorSchema = z
  .object({
    id: z.string(),
    static: staticPropertySchema,
    label: z.string().optional(),
    name: z.string(),
    fieldType: z.literal("Separator"),
  })
  .describe(
    "Separator element, use it to group related fields together, include label if you want to add a label in the middle",
  );

const socialLinksSchema = z
  .object({
    id: z.string(),
    static: staticPropertySchema.optional().default(true),
    name: z.string(),
    label: z.string().optional().default("Continue with"),
    links: z.array(z.enum(socialKeys)),
    fieldType: z.literal("SocialMediaButtons"),
    required: z.boolean().optional(),
    layout: z
      .enum(["row", "column"])
      .default("row")
      .describe(
        "use column for vertical layout and when links items are more than 3 or upon user request",
      ),
  })
  .describe("This include a list of social links, use it to add social links to your form");

const fieldSchema = z.union([
  InputFieldSchema,
  passwordSchema,
  otpSchema,
  textareaSchema,
  selectSchema,
  sliderSchema,
  toggleGroupSchema,
  radioSchema,
  switchSchema,
  datePickerSchema,
  h1Schema,
  h2Schema,
  h3Schema,
  paragraphSchema,
  separatorSchema,
  checkboxSchema,
  multiSelectSchema,
  ratingSchema,
  comboboxSchema,
  socialLinksSchema,
]);

const singleFormFieldsSchema = z.array(fieldSchema).describe("Form fields in single step");

const multistepFormFieldsSchema = z
  .array(
    z.object({
      id: z.string(),
      stepFields: z.array(fieldSchema),
    }),
  )
  .describe("Fields for each step in a multi-step form");

const singleStepFormSchema = z.object({
  title: z.string().describe("Form title"),
  isMS: z.literal(false).default(false),
  fields: singleFormFieldsSchema,
});

const multiStepFormSchema = z.object({
  title: z.string().describe("Form title"),
  isMS: z.literal(true),
  fields: multistepFormFieldsSchema,
});

export const aiFormSchema = z.object({
  form: z.object({
    title: z.string().describe("Form title"),
    isMS: z.boolean().default(false).describe("Whether the form has multiple steps"),
    fields: z.union([singleFormFieldsSchema, multistepFormFieldsSchema]),
  }),
});

export const normalizedAiFormSchema = z.object({
  form: z.discriminatedUnion("isMS", [singleStepFormSchema, multiStepFormSchema]),
});

export const aiGeneratedFormSummarySchema = z.object({
  summary: z.string(),
  fieldCount: z.number().int().nonnegative(),
  stepCount: z.number().int().nonnegative(),
  isMS: z.boolean(),
  title: z.string(),
});

export const aiGeneratedFormResultSchema = normalizedAiFormSchema.extend(
  aiGeneratedFormSummarySchema.shape,
);

type SingleStepGeneratedForm = z.output<typeof singleStepFormSchema>;
type MultiStepGeneratedForm = z.output<typeof multiStepFormSchema>;
type AiGeneratedFormField = z.output<typeof fieldSchema>;
type AiGeneratedFormStep = z.output<typeof multistepFormFieldsSchema>[number];
type RawAiGeneratedFormDraft = z.output<typeof aiFormSchema>;

export type AiGeneratedFormDraft = z.output<typeof normalizedAiFormSchema>;
export type AiGeneratedFormInput = z.input<typeof aiFormSchema>;
export type AiGeneratedForm = SingleStepGeneratedForm | MultiStepGeneratedForm;
export type AiGeneratedFormResult = z.output<typeof aiGeneratedFormResultSchema>;

export const AI_FORM_SYSTEM_PROMPT =
  "You are an expert form generator. Your task is to convert natural language form descriptions into structured JSON that matches the provided Zod schema.\n\n" +
  "Key instructions:\n" +
  "- Generate complete form elements based on the user's description.\n" +
  "- The schema supports both interactive input fields and static text elements.\n" +
  "- Use text elements (H1, H2, H3, Paragraph) to add titles, descriptions, and section headers when helpful.\n" +
  "- Ignore submit buttons, action buttons, or form submission controls.\n" +
  "- Ensure all generated JSON strictly adheres to the schema structure.\n" +
  "- Include all required fields such as id, name, label, and fieldType.\n" +
  "- Generate unique ids for each form element and step.\n" +
  "- For refinement requests, return the full updated form rather than a partial patch.\n" +
  "- Prefer realistic field groupings, clear labels, and sensible defaults.\n" +
  "- When a form is multi-step, every step must have its own id and stepFields array.";

function ensureField<T extends AiGeneratedFormField>(field: T, index: number): T {
  const normalized = { ...field };
  if (!normalized.id) {
    normalized.id = crypto.randomUUID();
  }
  if (!normalized.name) {
    normalized.name = `${normalized.fieldType.toLowerCase()}-${index + 1}`;
  }
  return normalized;
}

export function normalizeAiGeneratedFormDraft(
  draft: RawAiGeneratedFormDraft | AiGeneratedFormDraft,
): AiGeneratedFormDraft {
  const title = draft.form.title.trim() || "Generated Form";
  const hasStepFields =
    Array.isArray(draft.form.fields) &&
    draft.form.fields.some(
      (field) =>
        !!field &&
        typeof field === "object" &&
        "stepFields" in field &&
        Array.isArray(field.stepFields),
    );

  if (draft.form.isMS === true || hasStepFields) {
    const multiStepForm = draft.form as MultiStepGeneratedForm;
    const fields: AiGeneratedFormStep[] = multiStepForm.fields.map((step, stepIndex) => ({
      id: step.id || crypto.randomUUID(),
      stepFields: step.stepFields.map((field, fieldIndex) =>
        ensureField(field, stepIndex * 100 + fieldIndex),
      ),
    }));

    return {
      form: {
        ...draft.form,
        title,
        isMS: true,
        fields,
      },
    };
  }

  return {
    form: {
      ...(draft.form as SingleStepGeneratedForm),
      title,
      isMS: false,
      fields: (draft.form as SingleStepGeneratedForm).fields.map((field, index) =>
        ensureField(field, index),
      ),
    },
  };
}

export function summarizeAiGeneratedForm(
  draft: AiGeneratedFormDraft,
): z.infer<typeof aiGeneratedFormSummarySchema> {
  if (draft.form.isMS === true) {
    const steps = (draft.form as MultiStepGeneratedForm).fields;
    const fieldCount = steps.reduce((count, step) => count + step.stepFields.length, 0);
    return {
      summary: `Multi-step form with ${steps.length} steps and ${fieldCount} fields`,
      fieldCount,
      stepCount: steps.length,
      isMS: true,
      title: draft.form.title,
    };
  }

  return {
    summary: `Single-step form with ${(draft.form as SingleStepGeneratedForm).fields.length} fields`,
    fieldCount: (draft.form as SingleStepGeneratedForm).fields.length,
    stepCount: 1,
    isMS: false,
    title: draft.form.title,
  };
}
