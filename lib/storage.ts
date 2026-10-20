"use client";

import {
  INITIAL_PROJECTS,
  INITIAL_BUILDERS,
  INITIAL_FEEDBACKS,
  INITIAL_COMMENTS,
  INITIAL_TIMELINE,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_NOTIFICATIONS,
} from "./mockData";
import {
  Project,
  Builder,
  FeedbackItem,
  CommentItem,
  TimelineUpdate,
  CommunityPost,
  NotificationItem,
} from "./types";

const STORAGE_KEYS = {
  PROJECTS: "lumio_clean_projects",
  BUILDERS: "lumio_clean_builders",
  FEEDBACKS: "lumio_clean_feedbacks",
  COMMENTS: "lumio_clean_comments",
  TIMELINE: "lumio_clean_timeline",
  COMMUNITY: "lumio_clean_community",
  NOTIFICATIONS: "lumio_clean_notifications",
  CURRENT_USER: "lumio_clean_current_user",
  LIKED_PROJECT_IDS: "lumio_clean_liked_projects",
  LIKED_COMMUNITY_IDS: "lumio_clean_liked_community",
  UPVOTED_FEEDBACK_IDS: "lumio_clean_upvoted_feedbacks",
  FOLLOWED_BUILDER_IDS: "lumio_clean_followed_builders",
};

// Purge legacy mock data in browser
if (typeof window !== "undefined") {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("cozit_") || k.startsWith("lumio_v2_") || k.startsWith("lumio_liked") || k.startsWith("lumio_upvoted") || k.startsWith("lumio_followed"))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// -------------------------------------------------------------
// Shared Server Synchronization (All devices / users see same data)
// -------------------------------------------------------------
export async function syncAllWithServer(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const [pRes, bRes, cRes] = await Promise.allSettled([
      fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/builders", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/community", { cache: "no-store" }).then((r) => r.json()),
    ]);

    let changed = false;

    // Resilient Projects sync
    if (pRes.status === "fulfilled" && Array.isArray(pRes.value)) {
      const localProjects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
      const map = new Map<string, Project>();
      localProjects.forEach((p) => map.set(p.id, p));

      const serverIds = new Set<string>();
      pRes.value.forEach((sp: Project) => {
        serverIds.add(sp.id);
        const existing = map.get(sp.id);
        map.set(sp.id, {
          ...existing,
          ...sp,
          likesCount: Math.max(existing?.likesCount ?? 0, sp.likesCount ?? 0),
          viewsCount: Math.max(existing?.viewsCount ?? 0, sp.viewsCount ?? 0),
          commentsCount: Math.max(existing?.commentsCount ?? 0, sp.commentsCount ?? 0),
          feedbacksCount: Math.max(existing?.feedbacksCount ?? 0, sp.feedbacksCount ?? 0),
        });
      });

      // Re-seed server if server restarted and lost local user projects
      localProjects.forEach((lp) => {
        if (!serverIds.has(lp.id)) {
          fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lp),
          }).catch(() => {});
        }
      });

      setStoredItem(STORAGE_KEYS.PROJECTS, Array.from(map.values()));
      changed = true;
    }

    // Resilient Builders sync
    if (bRes.status === "fulfilled" && Array.isArray(bRes.value) && bRes.value.length > 0) {
      const localBuilders = getStoredItem<Builder[]>(STORAGE_KEYS.BUILDERS, []);
      const map = new Map<string, Builder>();
      localBuilders.forEach((b) => map.set(b.id, b));
      bRes.value.forEach((b: any) => {
        const existing = map.get(b.id);
        map.set(b.id, { ...existing, ...b });
      });
      setStoredItem(STORAGE_KEYS.BUILDERS, Array.from(map.values()));
      changed = true;
    }

    // Resilient Community sync
    if (cRes.status === "fulfilled" && Array.isArray(cRes.value)) {
      const localPosts = getStoredItem<CommunityPost[]>(STORAGE_KEYS.COMMUNITY, []);
      const map = new Map<string, CommunityPost>();
      localPosts.forEach((p) => map.set(p.id, p));

      const serverIds = new Set<string>();
      cRes.value.forEach((sp: CommunityPost) => {
        serverIds.add(sp.id);
        const existing = map.get(sp.id);
        map.set(sp.id, {
          ...existing,
          ...sp,
          likesCount: Math.max(existing?.likesCount ?? 0, sp.likesCount ?? 0),
          commentsCount: Math.max(existing?.commentsCount ?? 0, sp.commentsCount ?? 0),
        });
      });

      localPosts.forEach((lp) => {
        if (!serverIds.has(lp.id)) {
          fetch("/api/community", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lp),
          }).catch(() => {});
        }
      });

      setStoredItem(STORAGE_KEYS.COMMUNITY, Array.from(map.values()));
      changed = true;
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent("lumio_data_synced"));
    }
  } catch (err) {
    console.warn("Storage sync error:", err);
  }
}

export async function fetchSharedProjects(): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const localProjects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
        const map = new Map<string, Project>();
        localProjects.forEach((p) => map.set(p.id, p));

        const serverIds = new Set<string>();
        data.forEach((sp: Project) => {
          serverIds.add(sp.id);
          const existing = map.get(sp.id);
          map.set(sp.id, {
            ...existing,
            ...sp,
            likesCount: Math.max(existing?.likesCount ?? 0, sp.likesCount ?? 0),
            viewsCount: Math.max(existing?.viewsCount ?? 0, sp.viewsCount ?? 0),
            commentsCount: Math.max(existing?.commentsCount ?? 0, sp.commentsCount ?? 0),
            feedbacksCount: Math.max(existing?.feedbacksCount ?? 0, sp.feedbacksCount ?? 0),
          });
        });

        // Re-push local-only projects if server restarted
        localProjects.forEach((lp) => {
          if (!serverIds.has(lp.id)) {
            fetch("/api/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(lp),
            }).catch(() => {});
          }
        });

        const merged = Array.from(map.values());
        setStoredItem(STORAGE_KEYS.PROJECTS, merged);

        const likedIds = getStoredItem<string[]>(STORAGE_KEYS.LIKED_PROJECT_IDS, []);
        const followedIds = getStoredItem<string[]>(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, []);
        return merged.map((p) => ({
          ...p,
          isLiked: likedIds.includes(p.id),
          likesCount: Math.max(p.likesCount ?? 0, likedIds.includes(p.id) ? 1 : 0),
          author: p.author
            ? {
                ...p.author,
                isFollowing: followedIds.includes(p.author.id),
              }
            : p.author,
        }));
      }
    }
  } catch {}
  return getProjects();
}

export async function fetchSharedBuilders(currentUserId?: string): Promise<Builder[]> {
  try {
    const url = currentUserId
      ? `/api/builders?currentUserId=${encodeURIComponent(currentUserId)}`
      : `/api/builders`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const followedIds = getStoredItem<string[]>(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, []);
        const localBuilders = getStoredItem<Builder[]>(STORAGE_KEYS.BUILDERS, []);

        // Resilient merge: keep all known local builders and update with incoming data
        const map = new Map<string, Builder>();
        localBuilders.forEach((b) => map.set(b.id, b));

        data.forEach((b) => {
          const existing = map.get(b.id);
          const isFollowing = currentUserId
            ? (b.isFollowing ?? followedIds.includes(b.id))
            : followedIds.includes(b.id);
          map.set(b.id, {
            ...existing,
            ...b,
            followersCount: b.followersCount ?? existing?.followersCount ?? 0,
            isFollowing,
          });
        });

        const merged = Array.from(map.values());

        if (currentUserId) {
          const serverFollowedIds = merged.filter((b) => b.isFollowing).map((b) => b.id);
          setStoredItem(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, serverFollowedIds);
        }

        setStoredItem(STORAGE_KEYS.BUILDERS, merged);
        return merged;
      }
    }
  } catch {}
  return getBuilders();
}

export async function fetchSharedCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const res = await fetch("/api/community", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const localPosts = getStoredItem<CommunityPost[]>(STORAGE_KEYS.COMMUNITY, []);
        const map = new Map<string, CommunityPost>();
        localPosts.forEach((p) => map.set(p.id, p));

        const serverIds = new Set<string>();
        data.forEach((sp: CommunityPost) => {
          serverIds.add(sp.id);
          const existing = map.get(sp.id);
          map.set(sp.id, {
            ...existing,
            ...sp,
            likesCount: Math.max(existing?.likesCount ?? 0, sp.likesCount ?? 0),
            commentsCount: Math.max(existing?.commentsCount ?? 0, sp.commentsCount ?? 0),
          });
        });

        localPosts.forEach((lp) => {
          if (!serverIds.has(lp.id)) {
            fetch("/api/community", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(lp),
            }).catch(() => {});
          }
        });

        const merged = Array.from(map.values());
        setStoredItem(STORAGE_KEYS.COMMUNITY, merged);

        const likedPostIds = getStoredItem<string[]>(STORAGE_KEYS.LIKED_COMMUNITY_IDS, []);
        return merged.map((p) => ({
          ...p,
          isLiked: likedPostIds.includes(p.id),
          likesCount: Math.max(p.likesCount ?? 0, likedPostIds.includes(p.id) ? 1 : 0),
        }));
      }
    }
  } catch {}
  return getCommunityPosts();
}

// Auto sync on client load and window focus
if (typeof window !== "undefined") {
  syncAllWithServer();
  window.addEventListener("focus", () => syncAllWithServer());
}

// Current User State
export function getCurrentUser(): Builder | null {
  return getStoredItem<Builder | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: Builder | null): void {
  setStoredItem(STORAGE_KEYS.CURRENT_USER, user);
}

// Projects
export function getProjects(): Project[] {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const likedIds = getStoredItem<string[]>(STORAGE_KEYS.LIKED_PROJECT_IDS, []);
  const followedIds = getStoredItem<string[]>(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, []);
  return projects.map((p) => {
    const isLiked = likedIds.includes(p.id);
    return {
      ...p,
      isLiked,
      likesCount: Math.max(p.likesCount ?? 0, isLiked ? 1 : 0),
      author: p.author
        ? {
            ...p.author,
            isFollowing: followedIds.includes(p.author.id),
          }
        : p.author,
    };
  });
}

export function getProjectById(id: string): Project | undefined {
  const projects = getProjects();
  return projects.find((p) => p.id === id);
}

export function saveProject(projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "likesCount" | "viewsCount" | "commentsCount" | "feedbacksCount" | "followersCount">): Project {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const newProject: Project = {
    ...projectData,
    id: `proj-${Date.now()}`,
    likesCount: 0,
    viewsCount: 1,
    commentsCount: 0,
    feedbacksCount: 0,
    followersCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newProject, ...projects];
  setStoredItem(STORAGE_KEYS.PROJECTS, updated);

  // Sync to server & Supabase
  if (typeof window !== "undefined") {
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    }).catch((e) => console.warn("Failed to sync project to server:", e));
  }

  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  let updatedProject: Project | null = null;
  const updatedProjects = projects.map((p) => {
    if (p.id === id) {
      updatedProject = {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedProject;
    }
    return p;
  });

  if (updatedProject) {
    setStoredItem(STORAGE_KEYS.PROJECTS, updatedProjects);

    // Sync to server & Supabase
    if (typeof window !== "undefined") {
      fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      }).catch((e) => console.warn("Failed to sync project update:", e));
    }
  }
  return updatedProject;
}

export function deleteProject(id: string): boolean {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const remaining = projects.filter((p) => p.id !== id);
  setStoredItem(STORAGE_KEYS.PROJECTS, remaining);

  // Clean up associated feedbacks, comments, timeline
  const feedbacks = getStoredItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  setStoredItem(STORAGE_KEYS.FEEDBACKS, feedbacks.filter((f) => f.projectId !== id));

  const comments = getStoredItem<CommentItem[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  setStoredItem(STORAGE_KEYS.COMMENTS, comments.filter((c) => c.projectId !== id));

  const timeline = getStoredItem<TimelineUpdate[]>(STORAGE_KEYS.TIMELINE, INITIAL_TIMELINE);
  setStoredItem(STORAGE_KEYS.TIMELINE, timeline.filter((t) => t.projectId !== id));

  // Sync to server & Supabase
  if (typeof window !== "undefined") {
    fetch(`/api/projects?id=${id}`, { method: "DELETE" }).catch((e) =>
      console.warn("Failed to sync project deletion:", e)
    );
  }

  return true;
}

export function toggleProjectLike(projectId: string, userId?: string): { likesCount: number; isLiked: boolean } {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const likedIds = getStoredItem<string[]>(STORAGE_KEYS.LIKED_PROJECT_IDS, []);
  
  const isCurrentlyLiked = likedIds.includes(projectId);
  const newLikedIds = isCurrentlyLiked
    ? likedIds.filter((id) => id !== projectId)
    : [...likedIds, projectId];

  setStoredItem(STORAGE_KEYS.LIKED_PROJECT_IDS, newLikedIds);

  let newLikesCount = 0;
  const updatedProjects = projects.map((p) => {
    if (p.id === projectId) {
      const delta = isCurrentlyLiked ? -1 : 1;
      newLikesCount = Math.max(0, p.likesCount + delta);
      return { ...p, likesCount: newLikesCount };
    }
    return p;
  });

  setStoredItem(STORAGE_KEYS.PROJECTS, updatedProjects);

  // Sync to server
  if (typeof window !== "undefined") {
    fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, action: "like", userId }),
    }).catch(() => {});
  }

  return { likesCount: newLikesCount, isLiked: !isCurrentlyLiked };
}

export function recordProjectView(projectId: string): void {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const updated = projects.map((p) => {
    if (p.id === projectId) {
      return { ...p, viewsCount: (p.viewsCount || 0) + 1 };
    }
    return p;
  });
  setStoredItem(STORAGE_KEYS.PROJECTS, updated);

  if (typeof window !== "undefined") {
    fetch(`/api/projects?view=${encodeURIComponent(projectId)}`, { cache: "no-store" }).catch(() => {});
  }
}

export function recordProjectOutboundClick(projectId: string): void {
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const updated = projects.map((p) => {
    if (p.id === projectId) {
      const currentInsights = p.insights || {
        viewsTotal: p.viewsCount || 0,
        likesTotal: p.likesCount || 0,
        outboundClicks: 0,
        viewsByDay: [],
        referrers: [],
        trendingRank: 1,
        rankChange: 0,
      };
      return {
        ...p,
        insights: {
          ...currentInsights,
          outboundClicks: (currentInsights.outboundClicks || 0) + 1,
        },
      };
    }
    return p;
  });
  setStoredItem(STORAGE_KEYS.PROJECTS, updated);

  if (typeof window !== "undefined") {
    fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, action: "outboundClick" }),
    }).catch(() => {});
  }
}

// Feedbacks
export function getFeedbacksByProject(projectId: string): FeedbackItem[] {
  const feedbacks = getStoredItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  const upvotedIds = getStoredItem<string[]>(STORAGE_KEYS.UPVOTED_FEEDBACK_IDS, []);
  return feedbacks
    .filter((f) => f.projectId === projectId)
    .map((f) => ({
      ...f,
      isUpvoted: upvotedIds.includes(f.id),
    }));
}

export async function fetchSharedFeedbacks(projectId: string): Promise<FeedbackItem[]> {
  try {
    const res = await fetch(`/api/feedbacks?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const localFeedbacks = getStoredItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
        const map = new Map<string, FeedbackItem>();
        localFeedbacks.forEach((f) => map.set(f.id, f));

        data.forEach((sf: FeedbackItem) => {
          const existing = map.get(sf.id);
          map.set(sf.id, {
            ...existing,
            ...sf,
            upvotes: Math.max(existing?.upvotes || 0, sf.upvotes || 0),
          });
        });

        // Sync local feedbacks missing from server
        localFeedbacks
          .filter((lf) => lf.projectId === projectId && !data.some((d) => d.id === lf.id))
          .forEach((missing) => {
            fetch("/api/feedbacks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(missing),
            }).catch(() => {});
          });

        const merged = Array.from(map.values());
        setStoredItem(STORAGE_KEYS.FEEDBACKS, merged);

        const upvotedIds = getStoredItem<string[]>(STORAGE_KEYS.UPVOTED_FEEDBACK_IDS, []);
        return merged
          .filter((f) => f.projectId === projectId)
          .map((f) => ({
            ...f,
            isUpvoted: upvotedIds.includes(f.id),
          }));
      }
    }
  } catch {}
  return getFeedbacksByProject(projectId);
}

export function addFeedback(feedback: Omit<FeedbackItem, "id" | "createdAt" | "upvotes" | "commentsCount">): FeedbackItem {
  const feedbacks = getStoredItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  const newItem: FeedbackItem = {
    ...feedback,
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    commentsCount: 0,
  };

  const updated = [newItem, ...feedbacks];
  setStoredItem(STORAGE_KEYS.FEEDBACKS, updated);

  // Auto upvote by creator
  const upvotedIds = getStoredItem<string[]>(STORAGE_KEYS.UPVOTED_FEEDBACK_IDS, []);
  setStoredItem(STORAGE_KEYS.UPVOTED_FEEDBACK_IDS, [...upvotedIds, newItem.id]);

  // Update project feedback count
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const updatedProjects = projects.map((p) =>
    p.id === feedback.projectId ? { ...p, feedbacksCount: (p.feedbacksCount || 0) + 1 } : p
  );
  setStoredItem(STORAGE_KEYS.PROJECTS, updatedProjects);

  if (typeof window !== "undefined") {
    fetch("/api/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    }).catch(() => {});
  }

  return newItem;
}

export function toggleFeedbackUpvote(feedbackId: string): { upvotes: number; isUpvoted: boolean } {
  const feedbacks = getStoredItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  const upvotedIds = getStoredItem<string[]>(STORAGE_KEYS.UPVOTED_FEEDBACK_IDS, []);

  const isUpvoted = upvotedIds.includes(feedbackId);
  const newUpvotedIds = isUpvoted
    ? upvotedIds.filter((id) => id !== feedbackId)
    : [...upvotedIds, feedbackId];

  setStoredItem(STORAGE_KEYS.UPVOTED_FEEDBACK_IDS, newUpvotedIds);

  let newCount = 0;
  const updatedFeedbacks = feedbacks.map((f) => {
    if (f.id === feedbackId) {
      newCount = Math.max(0, f.upvotes + (isUpvoted ? -1 : 1));
      return { ...f, upvotes: newCount };
    }
    return f;
  });

  setStoredItem(STORAGE_KEYS.FEEDBACKS, updatedFeedbacks);
  return { upvotes: newCount, isUpvoted: !isUpvoted };
}

// Comments
export function getCommentsByProject(projectId: string): CommentItem[] {
  const comments = getStoredItem<CommentItem[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  return comments.filter((c) => c.projectId === projectId);
}

export async function fetchSharedComments(projectId: string): Promise<CommentItem[]> {
  try {
    const res = await fetch(`/api/comments?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const localComments = getStoredItem<CommentItem[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
        const map = new Map<string, CommentItem>();
        localComments.forEach((c) => map.set(c.id, c));

        data.forEach((sc: CommentItem) => {
          const existing = map.get(sc.id);
          map.set(sc.id, {
            ...existing,
            ...sc,
            likes: Math.max(existing?.likes || 0, sc.likes || 0),
          });
        });

        localComments
          .filter((lc) => lc.projectId === projectId && !data.some((d) => d.id === lc.id))
          .forEach((missing) => {
            fetch("/api/comments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(missing),
            }).catch(() => {});
          });

        const merged = Array.from(map.values());
        setStoredItem(STORAGE_KEYS.COMMENTS, merged);

        return merged.filter((c) => c.projectId === projectId);
      }
    }
  } catch {}
  return getCommentsByProject(projectId);
}

export function addComment(comment: Omit<CommentItem, "id" | "createdAt" | "likes">): CommentItem {
  const comments = getStoredItem<CommentItem[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  const newItem: CommentItem = {
    ...comment,
    id: `cm-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  const updated = [...comments, newItem];
  setStoredItem(STORAGE_KEYS.COMMENTS, updated);

  // Update project comment count
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const updatedProjects = projects.map((p) =>
    p.id === comment.projectId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
  );
  setStoredItem(STORAGE_KEYS.PROJECTS, updatedProjects);

  if (typeof window !== "undefined") {
    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    }).catch(() => {});
  }

  return newItem;
}

export function deleteComment(commentId: string): boolean {
  const comments = getStoredItem<CommentItem[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  const target = comments.find((c) => c.id === commentId);
  const remaining = comments.filter((c) => c.id !== commentId);
  setStoredItem(STORAGE_KEYS.COMMENTS, remaining);

  if (target) {
    const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const updatedProjects = projects.map((p) =>
      p.id === target.projectId
        ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }
        : p
    );
    setStoredItem(STORAGE_KEYS.PROJECTS, updatedProjects);
  }

  if (typeof window !== "undefined") {
    fetch(`/api/comments?id=${encodeURIComponent(commentId)}`, { method: "DELETE" }).catch(() => {});
  }

  return true;
}

// Timeline Updates
export function getTimelineByProject(projectId: string): TimelineUpdate[] {
  const timeline = getStoredItem<TimelineUpdate[]>(STORAGE_KEYS.TIMELINE, INITIAL_TIMELINE);
  return timeline.filter((t) => t.projectId === projectId);
}

export function addTimelineUpdate(update: Omit<TimelineUpdate, "id" | "createdAt" | "likes">): TimelineUpdate {
  const timeline = getStoredItem<TimelineUpdate[]>(STORAGE_KEYS.TIMELINE, INITIAL_TIMELINE);
  const newItem: TimelineUpdate = {
    ...update,
    id: `tl-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };

  const updated = [newItem, ...timeline];
  setStoredItem(STORAGE_KEYS.TIMELINE, updated);
  return newItem;
}

export function deleteTimelineUpdate(timelineId: string): boolean {
  const timeline = getStoredItem<TimelineUpdate[]>(STORAGE_KEYS.TIMELINE, INITIAL_TIMELINE);
  const remaining = timeline.filter((t) => t.id !== timelineId);
  setStoredItem(STORAGE_KEYS.TIMELINE, remaining);
  return true;
}

// Community Posts
export function getCommunityPosts(): CommunityPost[] {
  const posts = getStoredItem<CommunityPost[]>(STORAGE_KEYS.COMMUNITY, INITIAL_COMMUNITY_POSTS);
  const likedPostIds = getStoredItem<string[]>(STORAGE_KEYS.LIKED_COMMUNITY_IDS, []);
  return posts.map((p) => {
    const isLiked = likedPostIds.includes(p.id);
    return {
      ...p,
      isLiked,
      likesCount: Math.max(p.likesCount ?? 0, isLiked ? 1 : 0),
    };
  });
}

export function toggleCommunityLike(postId: string, userId?: string): { likesCount: number; isLiked: boolean } {
  const posts = getStoredItem<CommunityPost[]>(STORAGE_KEYS.COMMUNITY, INITIAL_COMMUNITY_POSTS);
  const likedIds = getStoredItem<string[]>(STORAGE_KEYS.LIKED_COMMUNITY_IDS, []);
  
  const isCurrentlyLiked = likedIds.includes(postId);
  const newLikedIds = isCurrentlyLiked
    ? likedIds.filter((id) => id !== postId)
    : [...likedIds, postId];

  setStoredItem(STORAGE_KEYS.LIKED_COMMUNITY_IDS, newLikedIds);

  let newLikesCount = 0;
  const updatedPosts = posts.map((p) => {
    if (p.id === postId) {
      const delta = isCurrentlyLiked ? -1 : 1;
      newLikesCount = Math.max(0, p.likesCount + delta);
      return { ...p, likesCount: newLikesCount };
    }
    return p;
  });

  setStoredItem(STORAGE_KEYS.COMMUNITY, updatedPosts);

  if (typeof window !== "undefined") {
    fetch("/api/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, userId }),
    }).catch(() => {});
  }

  return { likesCount: newLikesCount, isLiked: !isCurrentlyLiked };
}

export function addCommunityPost(post: Omit<CommunityPost, "id" | "createdAt" | "likesCount" | "commentsCount">): CommunityPost {
  const posts = getCommunityPosts();
  const newPost: CommunityPost = {
    ...post,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
  };

  const updated = [newPost, ...posts];
  setStoredItem(STORAGE_KEYS.COMMUNITY, updated);

  if (typeof window !== "undefined") {
    fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost),
    }).catch((e) => console.warn("Failed to sync community post:", e));
  }

  return newPost;
}

export function deleteCommunityPost(id: string): boolean {
  const posts = getCommunityPosts();
  const filtered = posts.filter((p) => p.id !== id);
  setStoredItem(STORAGE_KEYS.COMMUNITY, filtered);

  if (typeof window !== "undefined") {
    fetch(`/api/community?id=${id}`, { method: "DELETE" }).catch((e) =>
      console.warn("Failed to sync community post deletion:", e)
    );
  }

  return true;
}

export function deleteFeedback(feedbackId: string): boolean {
  const feedbacks = getStoredItem<FeedbackItem[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  const target = feedbacks.find((f) => f.id === feedbackId);
  const remaining = feedbacks.filter((f) => f.id !== feedbackId);
  setStoredItem(STORAGE_KEYS.FEEDBACKS, remaining);

  if (target) {
    const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const updatedProjects = projects.map((p) =>
      p.id === target.projectId
        ? { ...p, feedbacksCount: Math.max(0, (p.feedbacksCount || 0) - 1) }
        : p
    );
    setStoredItem(STORAGE_KEYS.PROJECTS, updatedProjects);
  }

  if (typeof window !== "undefined") {
    fetch(`/api/feedbacks?id=${encodeURIComponent(feedbackId)}`, { method: "DELETE" }).catch(() => {});
  }
  return true;
}

// Builders
export function getBuilders(): Builder[] {
  const builders = getStoredItem<Builder[]>(STORAGE_KEYS.BUILDERS, INITIAL_BUILDERS);
  const followedIds = getStoredItem<string[]>(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, []);
  return builders.map((b) => {
    const isFollowing = followedIds.includes(b.id);
    let count = b.followersCount ?? 0;
    if (isFollowing && count === 0) {
      count = 1;
    }
    return {
      ...b,
      followersCount: count,
      isFollowing,
    };
  });
}

export function upsertBuilder(builder: Builder): void {
  const builders = getStoredItem<Builder[]>(STORAGE_KEYS.BUILDERS, []);
  const existingIdx = builders.findIndex((b) => b.id === builder.id);
  let updated: Builder[];
  if (existingIdx >= 0) {
    const existing = builders[existingIdx];
    updated = [...builders];
    updated[existingIdx] = {
      ...existing,
      ...builder,
      followersCount: builder.followersCount !== undefined ? builder.followersCount : (existing.followersCount ?? 0),
    };
  } else {
    updated = [{ ...builder, followersCount: builder.followersCount ?? 0 }, ...builders];
  }
  setStoredItem(STORAGE_KEYS.BUILDERS, updated);

  // Update projects author in localStorage
  const projects = getStoredItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
  let projectsUpdated = false;
  const newProjects = projects.map((p) => {
    if (p.author && (p.author.id === builder.id || p.author.handle === builder.handle)) {
      projectsUpdated = true;
      return {
        ...p,
        author: {
          ...p.author,
          name: builder.name,
          handle: builder.handle,
          avatar: builder.avatar,
          role: builder.role,
          bio: builder.bio,
          socials: builder.socials,
        },
      };
    }
    return p;
  });
  if (projectsUpdated) {
    setStoredItem(STORAGE_KEYS.PROJECTS, newProjects);
  }

  if (typeof window !== "undefined") {
    fetch("/api/builders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated[existingIdx >= 0 ? existingIdx : 0]),
    }).catch((e) => console.warn("Failed to sync builder:", e));
  }
}

export function toggleFollowBuilder(
  builderId: string,
  followerId?: string
): { isFollowing: boolean; followersCount: number } {
  const followedIds = getStoredItem<string[]>(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, []);
  const isFollowing = followedIds.includes(builderId);
  const nextFollowing = !isFollowing;
  const updatedFollowed = isFollowing
    ? followedIds.filter((id) => id !== builderId)
    : [...followedIds, builderId];

  setStoredItem(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, updatedFollowed);

  // Update builder in local storage
  const delta = nextFollowing ? 1 : -1;
  const builders = getStoredItem<Builder[]>(STORAGE_KEYS.BUILDERS, []);
  let newFollowersCount = nextFollowing ? 1 : 0;
  let builderFound = false;

  const updatedBuilders = builders.map((b) => {
    if (b.id === builderId) {
      builderFound = true;
      newFollowersCount = Math.max(0, (b.followersCount || 0) + delta);
      return { ...b, followersCount: newFollowersCount, isFollowing: nextFollowing };
    }
    return b;
  });

  if (builderFound) {
    setStoredItem(STORAGE_KEYS.BUILDERS, updatedBuilders);
  }

  // Also sync with server asynchronously
  if (typeof window !== "undefined") {
    fetch("/api/builders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ builderId, followerId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.followersCount === "number") {
          const currentBuilders = getStoredItem<Builder[]>(STORAGE_KEYS.BUILDERS, []);
          const synced = currentBuilders.map((b) =>
            b.id === builderId
              ? { ...b, followersCount: data.followersCount, isFollowing: data.isFollowing }
              : b
          );
          setStoredItem(STORAGE_KEYS.BUILDERS, synced);
          window.dispatchEvent(new CustomEvent("lumio_data_synced"));
        }
      })
      .catch((e) => console.warn("Failed to sync follow state:", e));
  }

  return { isFollowing: nextFollowing, followersCount: newFollowersCount };
}

export function isBuilderFollowed(builderId?: string): boolean {
  if (!builderId) return false;
  const followedIds = getStoredItem<string[]>(STORAGE_KEYS.FOLLOWED_BUILDER_IDS, []);
  return followedIds.includes(builderId);
}

// Notifications
export function getNotifications(): NotificationItem[] {
  return getStoredItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
}

export function markNotificationAsRead(id: string): void {
  const notifs = getNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
}

export function markAllNotificationsAsRead(): void {
  const notifs = getNotifications();
  const updated = notifs.map((n) => ({ ...n, read: true }));
  setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
}

