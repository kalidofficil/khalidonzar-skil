import type messages from "../../messages/en.json";
import type { Locale } from "./config";

// Makes t("...") calls type-checked against messages/en.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
