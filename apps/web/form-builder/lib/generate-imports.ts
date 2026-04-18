import type { FormElement } from "../form-types";

export const generateImports = (
  formElements: FormElement[],
  { isMS = false }: { isMS?: boolean } = { isMS: false },
): Set<string> => {
  const importSet = new Set([
    '"use client"',
    'import * as z from "zod"',
    "import { formSchema } from '@/lib/form-schema'",
    'import { zodResolver } from "@hookform/resolvers/zod"',
    'import { useForm, Controller } from "react-hook-form"',
    'import { motion } from "motion/react"',
    'import { Check } from "lucide-react"',
    'import { Field, FieldGroup, FieldContent, FieldLabel, FieldDescription, FieldError, FieldSeparator } from "@workspace/ui/components/field"',
  ]);
  if (isMS) {
    importSet.add(`import {
    FormHeader,
    FormFooter,
    StepFields,
    PreviousButton,
    NextButton,
    SubmitButton,
    MultiStepFormContent } from "@/components/multi-step-viewer";
import { MultiStepFormProvider } from "@/hooks/use-multi-step-viewer";
import { ChevronLeft, ChevronRight } from "lucide-react";
`);
  } else {
    importSet.add('import { Button } from "@workspace/ui/components/button"');
  }
  const processField = (field: FormElement) => {
    switch (field.fieldType) {
      case "DatePicker":
        importSet.add('import { format } from "date-fns"');
        importSet.add(
          'import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"',
        );
        importSet.add('import { cn } from "@/lib/utils"');
        importSet.add('import { Calendar } from "@workspace/ui/components/calendar"');
        importSet.add('import { Calendar as CalendarIcon, X } from "lucide-react"');
        break;
      case "OTP":
        importSet.add(
          'import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot\n} from "@workspace/ui/components/input-otp"',
        );
        break;
      case "Select":
        importSet.add(
          'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@workspace/ui/components/select"',
        );
        break;
      case "Combobox":
        importSet.add('import { Check, ChevronsUpDown } from "lucide-react"');
        importSet.add(
          'import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command"',
        );
        importSet.add(
          'import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"',
        );
        break;
      case "MultiSelect":
        importSet.add(
          `import {
              MultiSelect,
              MultiSelectContent,
              MultiSelectItem,
              MultiSelectTrigger,
              MultiSelectValue,
            } from '@workspace/ui/components/multi-select'`,
        );
        break;
      case "Password":
        importSet.add('import { Password } from "@/components/password"');
        break;
      case "Rating":
        importSet.add('import { Rating, RatingButton } from "@workspace/ui/components/rating"');
        break;
      case "RadioGroup":
        importSet.add(
          "import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'",
        );
        importSet.add("import { Label } from '@workspace/ui/components/label'");
        break;
      case "ToggleGroup":
        importSet.add(
          "import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group'",
        );
        break;
      case "FileUpload":
        importSet.add(
          `import type { ControllerFieldState, ControllerRenderProps } from 'react-hook-form';
           import { FileUpload } from '@/components/file-upload'`,
        );
        break;
      case "Separator":
      case "H1":
      case "H2":
      case "H3":
      case "P":
      case "Text":
      case "SocialMediaButtons":
        break;
      default:
        importSet.add(
          `import { ${
            field.fieldType
          } } from "@workspace/ui/components/${field.fieldType.toLowerCase()}"`,
        );
        break;
    }
  };

  formElements.flat().forEach(processField);
  return importSet;
};
