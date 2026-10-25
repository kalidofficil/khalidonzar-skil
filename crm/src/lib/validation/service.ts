import { z } from "zod";
import { BILLING_TYPES } from "@/lib/pipeline";
import { checkbox, optionalAedAmount, requiredEnum, requiredText } from "./fields";

export const serviceSchema = z.object({
  name: requiredText(120),
  billing: requiredEnum(BILLING_TYPES),
  default_price_fils: optionalAedAmount,
  is_active: checkbox,
});
