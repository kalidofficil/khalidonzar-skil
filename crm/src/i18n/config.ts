// Languages the UI can be shown in. To add Arabic later:
//   1. add "ar" here,
//   2. copy messages/en.json to messages/ar.json and translate it.
// Right-to-left layout switches on automatically for RTL languages.
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const rtlLocales: readonly string[] = ["ar"];

export function textDirection(locale: string): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

// All dates and "today" are calculated in Dubai time, whatever the server's clock says.
export const timeZone = "Asia/Dubai";
