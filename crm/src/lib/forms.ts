import type { z } from "zod";

/**
 * What a Server Action sends back to its form. On failure the form shows
 * `message` and per-field `errors`, and refills the inputs from `values`.
 * Error values are keys into messages/en.json "errors" (e.g. "required").
 */
export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  /** After success, the page the form should go to. */
  redirectTo?: string;
  /** After success, the id of the saved row (e.g. to attach files to it). */
  id?: string;
};

export const initialFormState: FormState = { ok: false };

/** FormData -> plain object of strings (ignores files and React's internal $ACTION fields). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

/** Turns a failed Zod validation into a FormState the form can display. */
export function validationFailed(
  error: z.ZodError,
  values: Record<string, string>,
): FormState {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "_");
    (errors[field] ??= []).push(issue.message);
  }
  return { ok: false, errors, values };
}
