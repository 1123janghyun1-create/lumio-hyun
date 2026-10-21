import { NextResponse } from "next/server";
import { getSharedBuilders, upsertSharedBuilder, toggleSharedBuilderFollow } from "@/lib/serverStore";
import { getSupabase } from "@/lib/supabase/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get("currentUserId") || undefined;

    const supabase = getSupabase();
    let builders: any[] = [];

    if (supabase) {
      try {
        const { data: profiles, error: pError } = await (supabase as any)
          .from("profiles")
          .select("*");

        if (!pError && Array.isArray(profiles)) {
          // Only real users (exclude mock IDs starting with builder-)
          const realProfiles = profiles.filter((p: any) => !p.id.startsWith("builder-"));
          // 1. Fetch remote follows
          let supabaseFollows: any[] = [];
          try {
            const { data: fData } = await (supabase as any).from("follows").select("*");
            if (Array.isArray(fData)) {
              supabaseFollows = fData;
            }
          } catch {}

          // 2. Fetch project stats per builder from projects table
          const projectStats = new Map<string, { projectsCount: number; totalLikes: number }>();
          try {
            const { data: projData } = await (supabase as any)
              .from("projects")
              .select("user_id, author, likes_count");
            if (Array.isArray(projData)) {
              projData.forEach((p: any) => {
                const uid = p.user_id || p.author?.id;
                if (uid) {
                  const stat = projectStats.get(uid) || { projectsCount: 0, totalLikes: 0 };
                  stat.projectsCount += 1;
                  stat.totalLikes += (p.likes_count || 0);
                  projectStats.set(uid, stat);
                }
              });
            }
          } catch {}

          builders = realProfiles.map((p: any) => {
            const forThis = supabaseFollows.filter((f) => f.following_id === p.id);
            const followersCount = forThis.length > 0 ? forThis.length : (p.followers_count || 0);
            const isFollowing = currentUserId
              ? forThis.some((f) => f.follower_id === currentUserId)
              : false;
            const stats = projectStats.get(p.id) || { projectsCount: 0, totalLikes: 0 };

            return {
              id: p.id,
              name: p.name || "Maker",
              handle: p.handle || "maker",
              avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
              bio: p.bio || "zemix 메이커",
              role: p.role || "Maker",
              isStartingMember: p.is_starting_member ?? true,
              followersCount,
              isFollowing,
              projectsCount: stats.projectsCount,
              totalLikes: stats.totalLikes,
              socials: {
                github: p.github_url,
                twitter: p.twitter_url,
                website: p.website_url,
              },
            };
          });
        }
      } catch (dbErr) {
        console.warn("Supabase profiles query error:", dbErr);
        builders = getSharedBuilders(currentUserId);
      }
    } else {
      builders = getSharedBuilders(currentUserId);
    }

    // Sort by followersCount descending (highest first), then by name
    builders.sort((a, b) => {
      const diff = (b.followersCount || 0) - (a.followersCount || 0);
      if (diff !== 0) return diff;
      return (a.name || "").localeCompare(b.name || "");
    });

    return NextResponse.json(builders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { builderId, followerId } = body;

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
        const supabase = getSupabase();
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
      const supabase = getSupabase();
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
