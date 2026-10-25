import type { Enums, Tables } from "./database.types";

// Short names for the database rows used around the app.
export type Company = Tables<"companies">;
export type Contact = Tables<"contacts">;
export type Profile = Tables<"profiles">;
export type AppRole = Enums<"app_role">;
