import fs from "fs";
import path from "path";
import { Builder, Project, CommunityPost, FeedbackItem, CommentItem, TimelineUpdate } from "./types";
import { createClient } from "./supabase/client";

interface StoreData {
  builders: Builder[];
  follows?: Record<string, string[]>; // builderId -> array of follower user IDs
  projects: Project[];
  communityPosts: CommunityPost[];
  feedbacks: FeedbackItem[];
  comments: CommentItem[];
  timeline: TimelineUpdate[];
}

const IS_VERCEL = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const SEED_FILE = path.join(process.cwd(), "data", "lumio-store.json");
const DATA_DIR = IS_VERCEL ? path.join("/tmp", "zemix-store") : path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "lumio-store.json");

function getEmptyStore(): StoreData {
  return {
    builders: [],
    follows: {},
    projects: [],
    communityPosts: [],
    feedbacks: [],
    comments: [],
    timeline: [],
  };
}

function ensureStoreFile(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(STORE_FILE)) {
      let initial: StoreData;
      if (IS_VERCEL && fs.existsSync(SEED_FILE)) {
        try {
          const seedContent = fs.readFileSync(SEED_FILE, "utf-8");
          initial = JSON.parse(seedContent) as StoreData;
        } catch {
          initial = getEmptyStore();
        }
      } else {
        initial = getEmptyStore();
      }
      if (!initial.follows) initial.follows = {};
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }

    const content = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(content) as StoreData;
    if (!parsed.follows) parsed.follows = {};
    return parsed;
  } catch (err) {
    console.error("Error reading store file:", err);
    return getEmptyStore();
  }
}

function writeStoreFile(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");

    // In local dev, also keep SEED_FILE updated if it's a different path
    if (STORE_FILE !== SEED_FILE && !IS_VERCEL && fs.existsSync(path.dirname(SEED_FILE))) {
      try {
        fs.writeFileSync(SEED_FILE, JSON.stringify(data, null, 2), "utf-8");
      } catch {}
    }
  } catch (err) {
    console.error("Error writing store file:", err);
  }
}

// ----------------- BUILDERS -----------------
export function getSharedBuilders(currentUserId?: string): Builder[] {
  const store = ensureStoreFile();
  if (!store.follows) store.follows = {};

  return store.builders.map((b) => {
    const hasFollowsRecord = Array.isArray(store.follows![b.id]);
    const followerList = hasFollowsRecord ? store.follows![b.id] : [];
    const count = hasFollowsRecord ? followerList.length : (b.followersCount ?? 0);
    const isFollowing = currentUserId ? followerList.includes(currentUserId) : false;

    return {
      ...b,
      followersCount: count,
      isFollowing,
    };
  });
}

export function upsertSharedBuilder(builder: Builder): Builder {
  const store = ensureStoreFile();
  if (!store.follows) store.follows = {};

  const existingIndex = store.builders.findIndex((b) => b.id === builder.id);
  const hasFollowsRecord = Array.isArray(store.follows[builder.id]);
  const realFollowersCount = hasFollowsRecord
    ? store.follows[builder.id].length
    : (existingIndex >= 0 ? (store.builders[existingIndex].followersCount ?? 0) : (builder.followersCount ?? 0));

  let savedBuilder: Builder;

  if (existingIndex >= 0) {
    const existing = store.builders[existingIndex];
    savedBuilder = {
      ...existing,
      ...builder,
      id: existing.id,
      followersCount: realFollowersCount,
    };
    store.builders[existingIndex] = savedBuilder;
  } else {
    savedBuilder = {
      ...builder,
      followersCount: realFollowersCount,
    };
    store.builders.push(savedBuilder);
  }

  // Also update projects author info if author matches
  store.projects = store.projects.map((p) => {
    if (p.author && (p.author.id === builder.id || p.author.handle === builder.handle)) {
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

  writeStoreFile(store);
  return savedBuilder;
}

export function toggleSharedBuilderFollow(
  builderId: string,
  followerId: string
): { isFollowing: boolean; followersCount: number } {
  const store = ensureStoreFile();
  if (!store.follows) store.follows = {};

  if (!store.follows[builderId]) {
    // If builder exists and has positive followersCount, seed if empty
    const existingBuilder = store.builders.find((b) => b.id === builderId);
    store.follows[builderId] = [];
  }

  // Cannot follow self
  if (!followerId || followerId === builderId) {
    return {
      isFollowing: false,
      followersCount: store.follows[builderId].length,
    };
  }

  const list = store.follows[builderId];
  const idx = list.indexOf(followerId);
  let isFollowing: boolean;

  if (idx >= 0) {
    list.splice(idx, 1);
    isFollowing = false;
  } else {
    list.push(followerId);
    isFollowing = true;
  }

  const count = list.length;

  // Update builder record in store.builders
  const b = store.builders.find((item) => item.id === builderId);
  if (b) {
    b.followersCount = count;
  }

  writeStoreFile(store);
  return { isFollowing, followersCount: count };
}

// ----------------- PROJECTS -----------------
export function getSharedProjects(): Project[] {
  const store = ensureStoreFile();
  return store.projects;
}

export function getSharedProjectById(id: string): Project | undefined {
  const store = ensureStoreFile();
  return store.projects.find((p) => p.id === id);
}

export function saveSharedProject(projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "likesCount" | "viewsCount" | "commentsCount" | "feedbacksCount" | "followersCount">): Project {
  const store = ensureStoreFile();
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

  store.projects = [newProject, ...store.projects];
  writeStoreFile(store);

  // Auto add author to shared builders
  if (projectData.author) {
    upsertSharedBuilder(projectData.author);
  }

  return newProject;
}

export function updateSharedProject(id: string, updates: Partial<Project>): Project | null {
  const store = ensureStoreFile();
  let updated: Project | null = null;
  store.projects = store.projects.map((p) => {
    if (p.id === id) {
      updated = {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    }
    return p;
  });

  if (updated) {
    writeStoreFile(store);
  }
  return updated;
}

export function deleteSharedProject(id: string): boolean {
  const store = ensureStoreFile();
  store.projects = store.projects.filter((p) => p.id !== id);
  store.feedbacks = store.feedbacks.filter((f) => f.projectId !== id);
  store.comments = store.comments.filter((c) => c.projectId !== id);
  store.timeline = store.timeline.filter((t) => t.projectId !== id);
  writeStoreFile(store);
  return true;
}

export function recordSharedProjectView(id: string): void {
  const store = ensureStoreFile();
  store.projects = store.projects.map((p) =>
    p.id === id ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p
  );
  writeStoreFile(store);
}

// ----------------- COMMUNITY POSTS -----------------
export function getSharedCommunityPosts(): CommunityPost[] {
  const store = ensureStoreFile();
  return store.communityPosts;
}

export function addSharedCommunityPost(post: Omit<CommunityPost, "id" | "createdAt" | "likesCount" | "commentsCount">): CommunityPost {
  const store = ensureStoreFile();
  const newPost: CommunityPost = {
    ...post,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
  };

  store.communityPosts = [newPost, ...store.communityPosts];
  writeStoreFile(store);

  if (post.author) {
    upsertSharedBuilder(post.author);
  }

  return newPost;
}

export function deleteSharedCommunityPost(id: string): boolean {
  const store = ensureStoreFile();
  store.communityPosts = store.communityPosts.filter((p) => p.id !== id);
  writeStoreFile(store);
  return true;
}

// ----------------- FEEDBACKS -----------------
export function getSharedFeedbacks(projectId: string): FeedbackItem[] {
  const store = ensureStoreFile();
  return store.feedbacks.filter((f) => f.projectId === projectId);
}

export function addSharedFeedback(feedback: Omit<FeedbackItem, "id" | "createdAt" | "upvotes" | "commentsCount">): FeedbackItem {
  const store = ensureStoreFile();
  const newItem: FeedbackItem = {
    ...feedback,
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    commentsCount: 0,
  };
  store.feedbacks = [newItem, ...store.feedbacks];

  // Update project feedbacksCount
  store.projects = store.projects.map((p) =>
    p.id === feedback.projectId ? { ...p, feedbacksCount: (p.feedbacksCount || 0) + 1 } : p
  );

  writeStoreFile(store);
  return newItem;
}

export function deleteSharedFeedback(id: string): boolean {
  const store = ensureStoreFile();
  const target = store.feedbacks.find((f) => f.id === id);
  store.feedbacks = store.feedbacks.filter((f) => f.id !== id);
  if (target) {
    store.projects = store.projects.map((p) =>
      p.id === target.projectId ? { ...p, feedbacksCount: Math.max(0, (p.feedbacksCount || 0) - 1) } : p
    );
  }
  writeStoreFile(store);
  return true;
}

// ----------------- COMMENTS -----------------
export function getSharedComments(projectId: string): CommentItem[] {
  const store = ensureStoreFile();
  return store.comments.filter((c) => c.projectId === projectId);
}

export function addSharedComment(comment: Omit<CommentItem, "id" | "createdAt" | "likes">): CommentItem {
  const store = ensureStoreFile();
  const newItem: CommentItem = {
    ...comment,
    id: `cm-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  store.comments = [...store.comments, newItem];

  // Update project commentsCount
  store.projects = store.projects.map((p) =>
    p.id === comment.projectId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
  );

  writeStoreFile(store);
  return newItem;
}

export function deleteSharedComment(id: string): boolean {
  const store = ensureStoreFile();
  const target = store.comments.find((c) => c.id === id);
  store.comments = store.comments.filter((c) => c.id !== id);
  if (target) {
    store.projects = store.projects.map((p) =>
      p.id === target.projectId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p
    );
  }
  writeStoreFile(store);
  return true;
}

// ----------------- TIMELINE -----------------
export function getSharedTimeline(projectId: string): TimelineUpdate[] {
  const store = ensureStoreFile();
  return store.timeline.filter((t) => t.projectId === projectId);
}

export function addSharedTimeline(update: Omit<TimelineUpdate, "id" | "createdAt" | "likes">): TimelineUpdate {
  const store = ensureStoreFile();
  const newItem: TimelineUpdate = {
    ...update,
    id: `tl-${Date.now()}`,
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  store.timeline = [newItem, ...store.timeline];
  writeStoreFile(store);
  return newItem;
}

export function deleteSharedTimeline(id: string): boolean {
  const store = ensureStoreFile();
  store.timeline = store.timeline.filter((t) => t.id !== id);
  writeStoreFile(store);
  return true;
}
