import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/";

  if (error) {
    console.error("Auth callback error received:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError && data?.session?.user) {
        const u = data.session.user;
        const meta = u.user_metadata || {};
        const email = u.email || "";
        const emailPrefix = email.split("@")[0] || "maker";
        const fullName = meta.full_name || meta.name || emailPrefix;
        const handle = (meta.user_name || emailPrefix).toLowerCase().replace(/[^a-z0-9_]/g, "") || "maker";
        const avatar = meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;

        // Ensure newly logged-in user is instantly registered into Supabase profiles table
        try {
          await (supabase as any).from("profiles").upsert({
            id: u.id,
            name: fullName,
            handle: handle,
            avatar_url: avatar,
            bio: meta.bio || "zemix 메이커",
            role: meta.role || "Maker",
            is_starting_member: true,
            github_url: meta.preferred_username ? `https://github.com/${meta.preferred_username}` : null,
            website_url: meta.website || null,
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("Auth callback profiles upsert error:", dbErr);
        }

        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
      console.error("Auth callback exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError?.message || "auth_failed")}`, requestUrl.origin)
      );
    }
  }

  // If code is missing or exchange failed, redirect with error
  return NextResponse.redirect(new URL(`/login?error=auth_failed`, requestUrl.origin));
}
