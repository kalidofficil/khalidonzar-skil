import { z } from "zod";
import { LANGUAGES } from "@/lib/options";
import {
  checkbox,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredEnum,
  requiredText,
} from "./fields";

export const contactSchema = z.object({
  company_id: z.uuid("required"),
  full_name: requiredText(150),
  job_title: optionalText(100),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: optionalEmail,
  preferred_language: requiredEnum(LANGUAGES),
  is_primary: checkbox,
  notes: optionalText(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
