import { createClient } from "@supabase/supabase-js";
import { Project, CommunityPost, FeedbackItem, CommentItem } from "@/lib/types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://pyyfsnovqxixhsxtirwt.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_0BveDUowGV-uo9_i7V_w_w_OeknYWKE";

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// Map Project to Supabase row format
export function projectToRow(p: Project) {
  return {
    id: p.id,
    user_id: p.author?.id || "anonymous",
    title: p.title,
    tagline: p.tagline || "",
    description: p.description || "",
    status: p.status || "Public",
    logo_url: p.logo || "",
    cover_url: p.coverImage || "",
    screenshots: p.screenshots || [],
    website_url: p.websiteUrl || "",
    github_url: p.githubUrl || null,
    author: p.author || {},
    tags: p.tags || [],
    likes_count: p.likesCount || 0,
    views_count: p.viewsCount || 1,
    comments_count: p.commentsCount || 0,
    feedbacks_count: p.feedbacksCount || 0,
    looking_for_team: !!p.lookingForTeam,
    looking_for_testers: !!p.lookingForTesters,
    insights: p.insights || {},
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  };
}

// Map Supabase row format to Project
export function rowToProject(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline || "",
    description: row.description || "",
    status: row.status || "Public",
    logo: row.logo_url || "",
    coverImage: row.cover_url || "",
    screenshots: row.screenshots || [],
    websiteUrl: row.website_url || "",
    githubUrl: row.github_url || undefined,
    author: row.author && row.author.id ? row.author : {
      id: row.user_id || "anonymous",
      name: "Maker",
      handle: "maker",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (row.user_id || "maker"),
      bio: "zemix 메이커",
      role: "Maker",
    },
    tags: row.tags || [],
    likesCount: row.likes_count || 0,
    viewsCount: row.views_count || 1,
    commentsCount: row.comments_count || 0,
    feedbacksCount: row.feedbacks_count || 0,
    followersCount: 0,
    lookingForTeam: !!row.looking_for_team,
    lookingForTesters: !!row.looking_for_testers,
    insights: row.insights || {
      viewsTotal: row.views_count || 1,
      likesTotal: row.likes_count || 0,
      outboundClicks: 0,
      viewsByDay: [],
      referrers: [],
      trendingRank: 1,
      rankChange: 0,
    },
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map CommunityPost to row
export function postToRow(post: CommunityPost) {
  return {
    id: post.id,
    category: post.category || "General",
    title: post.title,
    content: post.content,
    image_url: post.imageUrl || null,
    author: post.author || {},
    author_id: post.author?.id || null,
    likes_count: post.likesCount || 0,
    comments_count: post.commentsCount || 0,
    tags: post.tags || [],
    created_at: post.createdAt || new Date().toISOString(),
  };
}

// Map row to CommunityPost
export function rowToPost(row: any): CommunityPost {
  return {
    id: row.id,
    category: row.category || "General",
    title: row.title,
    content: row.content,
    imageUrl: row.image_url || undefined,
    author: row.author && row.author.id ? row.author : {
      id: row.author_id || "anonymous",
      name: "Maker",
      handle: "maker",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (row.author_id || "maker"),
      bio: "zemix 메이커",
      role: "Maker",
    },
    likesCount: row.likes_count || 0,
    commentsCount: row.comments_count || 0,
    tags: row.tags || [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}
