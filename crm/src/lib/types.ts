import type { Enums, Tables } from "./database.types";

// Short names for the database rows used around the app.
export type Company = Tables<"companies">;
export type Contact = Tables<"contacts">;
export type Profile = Tables<"profiles">;
export type AppRole = Enums<"app_role">;
export type Service = Tables<"services">;
export type Deal = Tables<"deals">;
export type Activity = Tables<"activities">;
export type Attachment = Tables<"attachments">;
export type DealStage = Enums<"deal_stage">;
export type ActivityChannel = Enums<"activity_channel">;
