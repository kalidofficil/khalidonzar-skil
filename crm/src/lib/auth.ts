import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole | null;
};

/**
 * The signed-in user and their role, or null. Cached per request, so calling
 * it from several components costs one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
});

/** Use at the top of every page and Server Action: sends signed-out users to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** True if the user has one of the given roles. */
export function hasRole(user: CurrentUser | null, ...roles: AppRole[]): boolean {
  return Boolean(user?.role && roles.includes(user.role));
}

/**
 * For Server Actions: returns the user and a Supabase client, or throws if the
 * user lacks the role. The database enforces the same rules (RLS); this check
 * just gives a clear error early.
 */
export async function requireRole(...roles: AppRole[]) {
  const user = await requireUser();
  if (!hasRole(user, ...roles)) {
    throw new Error("You don't have permission to do this.");
  }
  const supabase = await createClient();
  return { user, supabase };
}
