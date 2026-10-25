import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { homePathFor } from "@/lib/nav";

// "/" sends each user to the first section their role can use.
// (Phase 3 turns this into the Today page.)
export default async function Home() {
  const user = await requireUser();
  redirect(homePathFor(user.role));
}
