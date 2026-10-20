import { NextResponse } from "next/server";
import { getSharedBuilders, upsertSharedBuilder, toggleSharedBuilderFollow } from "@/lib/serverStore";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("currentUserId") || undefined;

    const localBuilders = getSharedBuilders(currentUserId);
    const builderMap = new Map<string, any>();
    localBuilders.forEach((b) => builderMap.set(b.id, b));

    // Also attempt Supabase profiles and follows query if available
    try {
      const supabase = createClient();
      if (supabase) {
        const { data: profiles, error: pError } = await (supabase as any).from("profiles").select("*");
        if (!pError && profiles && profiles.length > 0) {
          // Fetch remote follows if table exists
          let supabaseFollows: any[] = [];
          try {
            const { data: fData, error: fError } = await (supabase as any).from("follows").select("*");
            if (!fError && fData) {
              supabaseFollows = fData;
            }
          } catch {}

          profiles.forEach((p: any) => {
            const existing = builderMap.get(p.id) || {};
            let followersCount = existing.followersCount ?? 0;
            let isFollowing = existing.isFollowing ?? false;

            if (supabaseFollows.length > 0) {
              const forThis = supabaseFollows.filter((f) => f.following_id === p.id);
              followersCount = forThis.length;
              if (currentUserId) {
                isFollowing = forThis.some((f) => f.follower_id === currentUserId);
              }
            }

            builderMap.set(p.id, {
              ...existing,
              id: p.id,
              name: p.name || existing.name || "Maker",
              handle: p.handle || existing.handle || "maker",
              avatar: p.avatar_url || existing.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
              bio: p.bio || existing.bio || "zemix 메이커",
              role: p.role || existing.role || "Maker",
              isStartingMember: p.is_starting_member ?? existing.isStartingMember ?? true,
              followersCount: followersCount,
              isFollowing: isFollowing,
              totalLikes: existing.totalLikes ?? 0,
              projectsCount: existing.projectsCount ?? 0,
              socials: {
                github: p.github_url || existing.socials?.github,
                twitter: p.twitter_url || existing.socials?.twitter,
                website: p.website_url || existing.socials?.website,
              },
            });
          });
        }
      }
    } catch {}

    const allBuilders = Array.from(builderMap.values());

    // Sort by followersCount descending (highest first)
    allBuilders.sort((a, b) => {
      const diff = (b.followersCount || 0) - (a.followersCount || 0);
      if (diff !== 0) return diff;
      return (a.name || "").localeCompare(b.name || "");
    });

    return NextResponse.json(allBuilders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { builderId, followerId, delta } = body;

    if (!builderId) {
      return NextResponse.json({ error: "builderId is required" }, { status: 400 });
    }

    if (followerId && followerId === builderId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Toggle follow by followerId
    const targetFollowerId = followerId || "anonymous_user";
    const result = toggleSharedBuilderFollow(builderId, targetFollowerId);

    // Sync to Supabase follows table if available
    if (followerId) {
      try {
        const supabase = createClient();
        if (supabase) {
          if (result.isFollowing) {
            await (supabase as any).from("follows").insert({
              follower_id: followerId,
              following_id: builderId,
            });
          } else {
            await (supabase as any).from("follows").delete().match({
              follower_id: followerId,
              following_id: builderId,
            });
          }
        }
      } catch {}
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const builder = await req.json();
    if (!builder || !builder.id) {
      return NextResponse.json({ error: "Invalid builder data" }, { status: 400 });
    }

    const saved = upsertSharedBuilder(builder);

    // Sync to Supabase profiles
    try {
      const supabase = createClient();
      if (supabase) {
        await (supabase as any).from("profiles").upsert({
          id: builder.id,
          name: builder.name,
          handle: builder.handle,
          avatar_url: builder.avatar,
          bio: builder.bio,
          role: builder.role,
          github_url: builder.socials?.github,
          website_url: builder.socials?.website,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}

    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
