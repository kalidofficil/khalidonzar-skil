import { z } from "zod";
import { normalizeInstagram, normalizeWebsite } from "@/lib/links";
import { COMPANY_SOURCES, COMPANY_STATUSES, EMIRATES } from "@/lib/options";
import { parseTags } from "@/lib/tags";
import { optionalEnum, optionalText, requiredEnum, requiredText } from "./fields";

export const companySchema = z.object({
  name: requiredText(200),
  industry: optionalText(100),
  emirate: optionalEnum(EMIRATES),
  city: optionalText(100),
  website: optionalText(300).transform(normalizeWebsite),
  instagram: optionalText(300).transform(normalizeInstagram),
  source: optionalEnum(COMPANY_SOURCES),
  status: requiredEnum(COMPANY_STATUSES),
  tags: optionalText(1000).transform(parseTags),
  notes: optionalText(5000),
});

export type CompanyInput = z.infer<typeof companySchema>;
