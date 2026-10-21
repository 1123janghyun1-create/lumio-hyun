"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Builder } from "@/lib/types";
import { getCurrentUser, setCurrentUser as storeCurrentUser, upsertBuilder } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: Builder | null;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateUser: (updated: Builder) => Promise<void>;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => ({ error: null }),
  logout: async () => {},
  updateUser: async () => {},
  isSupabaseConnected: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Builder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  const syncUserFromSupabase = (sessionUser: any): Builder => {
    const meta = sessionUser.user_metadata || {};
    const email = sessionUser.email || "";
    const emailPrefix = email.split("@")[0] || "maker";
    
    // Support full Korean names, English names, nicknames without filtering out
    const fullName = meta.full_name || meta.name || emailPrefix;
    const avatar =
      meta.avatar_url ||
      meta.picture ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.id}`;
    const handle = (meta.user_name || emailPrefix).toLowerCase().replace(/[^a-z0-9_]/g, "") || "maker";

    const builder: Builder = {
      id: sessionUser.id,
      name: fullName,
      handle: handle,
      avatar: avatar,
      bio: meta.bio || "zemix 메이커",
      role: meta.role || "Maker",
      isStartingMember: true,
      socials: {
        website: meta.website,
        github: meta.preferred_username ? `https://github.com/${meta.preferred_username}` : undefined,
      },
    };

    return builder;
  };

  const loadUserProfile = async (sessionUser: any, supabaseClient: any): Promise<Builder> => {
    // 1. Google OAuth / raw auth fallback
    const rawFallback = syncUserFromSupabase(sessionUser);

    // 2. Fetch directly from Supabase profiles table (single source of truth for custom profile data)
    let dbProfile: any = null;
    try {
      if (supabaseClient) {
        const { data, error } = await (supabaseClient as any)
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (!error && data) {
          dbProfile = data;
        }
      }
    } catch (e) {
      console.warn("Profiles query error:", e);
    }

    // 3. Check localStorage
    const local = getCurrentUser();
    const hasMatchingLocal = local && local.id === sessionUser.id;

    // 4. Resolve current user:
    // When dbProfile exists, DB values are strictly preferred so customized bio, role, handle, name, socials persist!
    const meta = sessionUser.user_metadata || {};
    const resolved: Builder = {
      id: sessionUser.id,
      name: dbProfile?.name || (hasMatchingLocal ? local.name : null) || meta.full_name || meta.name || rawFallback.name,
      handle: dbProfile?.handle || (hasMatchingLocal ? local.handle : null) || meta.user_name || rawFallback.handle,
      avatar: dbProfile?.avatar_url || (hasMatchingLocal ? local.avatar : null) || meta.avatar_url || meta.picture || rawFallback.avatar,
      bio: dbProfile?.bio !== undefined && dbProfile?.bio !== null
        ? dbProfile.bio
        : (hasMatchingLocal && local.bio !== undefined ? local.bio : (meta.bio || "zemix 메이커")),
      role: dbProfile?.role || (hasMatchingLocal ? local.role : null) || meta.role || "Maker",
      isStartingMember: dbProfile?.is_starting_member ?? (hasMatchingLocal ? local.isStartingMember : true),
      followersCount: dbProfile?.followers_count ?? (hasMatchingLocal ? local.followersCount : 0),
      socials: {
        github: dbProfile?.github_url !== undefined ? (dbProfile.github_url || "") : (hasMatchingLocal ? local.socials?.github : undefined),
        twitter: dbProfile?.twitter_url !== undefined ? (dbProfile.twitter_url || "") : (hasMatchingLocal ? local.socials?.twitter : undefined),
        website: dbProfile?.website_url !== undefined ? (dbProfile.website_url || "") : (hasMatchingLocal ? local.socials?.website : undefined),
      },
    };

    // 5. If brand new user with no record in profiles, initialize in Supabase
    if (!dbProfile && supabaseClient) {
      try {
        await (supabaseClient as any).from("profiles").upsert({
          id: resolved.id,
          name: resolved.name,
          handle: resolved.handle,
          avatar_url: resolved.avatar,
          bio: resolved.bio,
          role: resolved.role,
          is_starting_member: resolved.isStartingMember,
          github_url: resolved.socials?.github || null,
          website_url: resolved.socials?.website || null,
          updated_at: new Date().toISOString(),
        });
      } catch (upsertErr) {
        console.warn("Initial profiles upsert error:", upsertErr);
      }
    }

    // 6. Ensure server API has registered this builder
    try {
      fetch("/api/builders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolved),
      }).catch(() => {});
    } catch {}

    setUser(resolved);
    storeCurrentUser(resolved);
    upsertBuilder(resolved);
    return resolved;
  };

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setIsSupabaseConnected(false);
      setUser(getCurrentUser());
      setLoading(false);
      return;
    }

    setIsSupabaseConnected(true);

    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (session?.user) {
        await loadUserProfile(session.user, supabase);
      } else {
        setUser(null);
        storeCurrentUser(null);
      }
      setLoading(false);
    });

    // 2. Real-time auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user, supabase);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        storeCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (redirectPath?: string) => {
    const supabase = createClient();
    if (!supabase) {
      return { error: new Error("Supabase 클라이언트를 초기화할 수 없습니다.") };
    }

    const searchParams = new URLSearchParams();
    if (redirectPath && redirectPath.startsWith("/")) {
      searchParams.set("next", redirectPath);
    }
    const query = searchParams.toString();
    const redirectTo = `${window.location.origin}/auth/callback${query ? `?${query}` : ""}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (!error && data?.url) {
      window.location.href = data.url;
    }

    return { error };
  };

  const logout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    storeCurrentUser(null);
    window.location.href = "/";
  };

  const updateUser = async (updated: Builder): Promise<void> => {
    setUser(updated);
    storeCurrentUser(updated);
    upsertBuilder(updated);

    // 1. Sync to server store via API
    try {
      await fetch("/api/builders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn("API builder sync error:", e);
    }

    const supabase = createClient();
    if (supabase) {
      // 2. Update Supabase Auth user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updated.name,
            name: updated.name,
            user_name: updated.handle,
            avatar_url: updated.avatar,
            picture: updated.avatar,
            bio: updated.bio,
            role: updated.role,
            website: updated.socials?.website || null,
            github: updated.socials?.github || null,
          },
        });
      } catch (authErr) {
        console.warn("Auth updateUser error:", authErr);
      }

      // 3. Upsert into profiles table
      try {
        await (supabase as any).from("profiles").upsert({
          id: updated.id,
          name: updated.name,
          handle: updated.handle,
          avatar_url: updated.avatar,
          bio: updated.bio,
          role: updated.role,
          github_url: updated.socials?.github || null,
          website_url: updated.socials?.website || null,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn("Profiles update error:", profileErr);
      }

      // 4. Update author info across user's projects and community posts in Supabase
      try {
        await (supabase as any)
          .from("projects")
          .update({ author: updated })
          .eq("user_id", updated.id);
      } catch {}

      try {
        await (supabase as any)
          .from("community_posts")
          .update({ author: updated })
          .eq("author_id", updated.id);
      } catch {}
    }

    // 5. Dispatch global sync event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lumio_data_synced"));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        logout,
        updateUser,
        isSupabaseConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
