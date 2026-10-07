// Authoritative admin gate for layouts, pages and server actions
// (plans/portfolio-cms-v2.md Phase 4): a valid Supabase session AND a row in
// admin_users. The membership read itself is protected by RLS
// (`user_id = auth.uid()`), so a forged or expired session yields no row.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login?error=session");
  }

  const { data: membership } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/admin/login?error=unauthorized");
  }

  return { user, supabase };
}
