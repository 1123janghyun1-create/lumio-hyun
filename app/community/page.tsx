"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  MessageSquare,
  Heart,
  Sparkles,
  Filter,
  Send,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  Share2,
  ArrowLeft,
  CornerDownRight,
} from "lucide-react";
import { CommunityPost, CommentItem } from "@/lib/types";
import {
  getCommunityPosts,
  addCommunityPost,
  deleteCommunityPost,
  fetchSharedCommunityPosts,
  toggleCommunityLike,
} from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

const CATEGORIES = [
  "All",
  "General",
  "Show & Tell",
  "Feedback Request",
  "Team Building",
  "Tips & Insights",
];

function CommunityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);

  // Selected post for detail & comments modal
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [postComments, setPostComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // New post fields
  const [newCategory, setNewCategory] = useState<any>("General");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initial load
  useEffect(() => {
    setPosts(getCommunityPosts());
    fetchSharedCommunityPosts().then((list) => {
      setPosts(list);
      // Check query param ?post=...
      const queryPostId = searchParams.get("post");
      if (queryPostId) {
        const found = list.find((p) => p.id === queryPostId);
        if (found) {
          openPostDetail(found);
        }
      }
    });

    const handleSync = () => fetchSharedCommunityPosts().then(setPosts);
    window.addEventListener("lumio_data_synced", handleSync);
    return () => window.removeEventListener("lumio_data_synced", handleSync);
  }, []);

  // Load comments whenever selectedPost changes
  const loadCommentsForPost = async (postId: string) => {
    try {
      setLoadingComments(true);
      const res = await fetch(`/api/comments?projectId=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPostComments(data);
        }
      }
    } catch (err) {
      console.error("Failed to load post comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const openPostDetail = (post: CommunityPost) => {
    setSelectedPost(post);
    loadCommentsForPost(post.id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/community?post=${encodeURIComponent(post.id)}`);
    }
  };

  const closePostDetail = () => {
    setSelectedPost(null);
    setPostComments([]);
    setNewComment("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/community");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadToCloudinary(file);
      setNewImageUrl(url);
    } catch (err: any) {
      console.error("Community image upload error:", err);
      alert(`이미지 업로드 실패: ${err?.message || "파일을 확인해주세요."}`);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (confirm("글을 작성하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login?redirect=/community");
      }
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    const created = addCommunityPost({
      category: newCategory,
      title: newTitle,
      content: newContent,
      imageUrl: newImageUrl || undefined,
      author: user,
    });

    setPosts([created, ...posts]);
    setNewTitle("");
    setNewContent("");
    setNewImageUrl("");
    setShowModal(false);
  };

  const handleLikePost = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      if (confirm("좋아요를 누르려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login?redirect=/community");
      }
      return;
    }
    const result = toggleCommunityLike(postId, user.id);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likesCount: result.likesCount,
              isLiked: result.isLiked,
            }
          : p
      )
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              likesCount: result.likesCount,
              isLiked: result.isLiked,
            }
          : null
      );
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (confirm("댓글을 작성하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push(`/login?redirect=/community?post=${selectedPost?.id}`);
      }
      return;
    }
    if (!newComment.trim() || !selectedPost) return;

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedPost.id,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setPostComments((prev) => [...prev, saved]);
        setNewComment("");

        // Increment count
        setSelectedPost((prev) =>
          prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null
        );
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    if (!selectedPost) return;

    try {
      const res = await fetch(
        `/api/comments?id=${encodeURIComponent(commentId)}&projectId=${encodeURIComponent(selectedPost.id)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setPostComments((prev) => prev.filter((c) => c.id !== commentId));
        setSelectedPost((prev) =>
          prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) } : null
        );
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) } : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleConfirmDeletePost = () => {
    if (!postToDelete) return;
    deleteCommunityPost(postToDelete.id);
    setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
    if (selectedPost && selectedPost.id === postToDelete.id) {
      closePostDetail();
    }
    setPostToDelete(null);
  };

  const filtered = posts.filter((p) =>
    selectedCategory === "All" ? true : p.category === selectedCategory
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            커뮤니티 라운지 (Community)
          </h1>
          <p className="mt-1 text-sm text-muted">
            사이드 프로젝트 개발기, 팀원 구인, 런칭 소식, 피드백 요청을 자유롭게 나눠보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              if (confirm("글을 작성하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
                router.push("/login?redirect=/community");
              }
              return;
            }
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          새 글 작성
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-border scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-muted hover:border-border-strong"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((post) => (
            <div
              key={post.id}
              onClick={() => openPostDetail(post)}
              className="rounded-card border border-border bg-surface p-6 shadow-sm hover:shadow-card hover:border-primary/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-[10px] font-bold">
                  {post.category}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                  {user && (user.id === post.author.id || user.handle === post.author.handle) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostToDelete(post);
                      }}
                      className="flex items-center gap-1 text-[11px] text-muted hover:text-danger transition-colors cursor-pointer ml-1 p-0.5"
                      title="게시글 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>삭제</span>
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                {post.title}
              </h3>

              <p className="text-xs text-muted leading-relaxed whitespace-pre-line mb-4 line-clamp-3">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-[10px] border border-border bg-surface-muted max-h-72">
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full object-cover max-h-72 group-hover:scale-[1.01] transition-transform"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted">
                {/* Author: Clickable to visit builder profile */}
                <div
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/builders/${post.author.id}`);
                  }}
                >
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="h-6 w-6 rounded-full border border-border object-cover"
                  />
                  <span className="font-medium text-foreground hover:underline">
                    {post.author.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">@{post.author.handle}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleLikePost(post.id, e)}
                    className={`flex items-center gap-1 cursor-pointer transition-colors ${
                      post.isLiked ? "text-danger" : "hover:text-foreground"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${post.isLiked ? "fill-danger" : ""}`} />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  <span className="flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{post.commentsCount || 0}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-card border border-dashed border-border bg-surface-muted/20 px-6">
            <p className="text-sm font-semibold text-foreground">
              아직 등록된 게시글이 없습니다
            </p>
            <p className="mt-1 text-xs text-muted">
              첫 번째 이야기를 작성하여 커뮤니티의 문을 열어보세요!
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors cursor-pointer"
            >
              새 글 작성하기
            </button>
          </div>
        )}
      </div>

      {/* DETAIL & COMMENTS MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-card border border-border bg-surface shadow-popover overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold">
                  {selectedPost.category}
                </span>
                <span className="text-xs text-muted">
                  {formatRelativeTime(selectedPost.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={closePostDetail}
                className="h-8 w-8 rounded-full text-muted hover:text-foreground hover:bg-surface-muted flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Author Row */}
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                onClick={() => {
                  closePostDetail();
                  router.push(`/builders/${selectedPost.author.id}`);
                }}
              >
                <img
                  src={selectedPost.author.avatar}
                  alt={selectedPost.author.name}
                  className="h-10 w-10 rounded-full border border-border object-cover"
                />
                <div>
                  <h4 className="text-sm font-semibold text-foreground hover:underline">
                    {selectedPost.author.name}
                  </h4>
                  <p className="text-xs text-muted">@{selectedPost.author.handle}</p>
                </div>
              </div>

              {/* Title & Content */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 leading-snug">
                  {selectedPost.title}
                </h2>
                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </div>
              </div>

              {/* Image if any */}
              {selectedPost.imageUrl && (
                <div className="rounded-[12px] overflow-hidden border border-border bg-surface-muted">
                  <img
                    src={selectedPost.imageUrl}
                    alt=""
                    className="w-full max-h-[480px] object-contain"
                  />
                </div>
              )}

              {/* Stats & Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => handleLikePost(selectedPost.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border transition-colors cursor-pointer ${
                      selectedPost.isLiked
                        ? "bg-danger-soft text-danger border-danger/30"
                        : "bg-surface-muted text-muted hover:text-foreground hover:bg-border/60"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${selectedPost.isLiked ? "fill-danger" : ""}`} />
                    <span className="font-semibold">{selectedPost.likesCount || 0}</span>
                  </button>

                  <span className="flex items-center gap-1.5 text-muted font-medium">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>댓글 {postComments.length}개</span>
                  </span>
                </div>

                {user && (user.id === selectedPost.author.id || user.handle === selectedPost.author.handle) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostToDelete(selectedPost);
                    }}
                    className="flex items-center gap-1 text-xs text-danger hover:underline cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>글 삭제</span>
                  </button>
                )}
              </div>

              {/* COMMENTS SECTION */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>댓글 ({postComments.length})</span>
                </h3>

                {/* Comment Input Box */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                  <textarea
                    rows={3}
                    placeholder={
                      user
                        ? "건설적인 피드백이나 댓글을 남겨보세요..."
                        : "댓글을 작성하려면 먼저 로그인이 필요합니다."
                    }
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submittingComment}
                    className="w-full rounded-[12px] border border-border bg-surface-muted/40 p-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:bg-surface transition-colors"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-muted">
                      {user ? `작성자: ${user.name}` : "로그인 후 댓글 작성 가능"}
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submittingComment ? "등록 중..." : "댓글 등록"}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 pt-2">
                  {loadingComments ? (
                    <div className="py-6 text-center text-xs text-muted animate-pulse">
                      댓글 불러오는 중...
                    </div>
                  ) : postComments.length > 0 ? (
                    postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-[12px] border border-border/80 bg-surface-muted/30 p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              closePostDetail();
                              router.push(`/builders/${comment.userId}`);
                            }}
                          >
                            <img
                              src={comment.userAvatar}
                              alt={comment.userName}
                              className="h-6 w-6 rounded-full border border-border object-cover"
                            />
                            <span className="text-xs font-semibold text-foreground hover:underline">
                              {comment.userName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>

                          {user && (user.id === comment.userId || user.name === comment.userName) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-muted hover:text-danger p-1 transition-colors cursor-pointer"
                              title="댓글 삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line pl-8">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted border border-dashed border-border/60 rounded-[12px]">
                      아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW POST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-popover">
            <h3 className="text-base font-bold text-foreground">커뮤니티 글 작성</h3>
            <p className="text-xs text-muted mt-1">
              메이커들과 함께 나누고 싶은 이야기를 적어주세요.
            </p>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  게시판 카테고리
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-control border border-border bg-surface p-2 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="General">General (자유 수다)</option>
                  <option value="Show & Tell">Show & Tell (프로젝트 자랑)</option>
                  <option value="Feedback Request">Feedback Request (피드백 요청)</option>
                  <option value="Team Building">Team Building (팀원 구인)</option>
                  <option value="Tips & Insights">Tips & Insights (팁과 통찰)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="제목을 입력하세요"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-control border border-border bg-surface p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  내용
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="내용을 자세히 작성해주세요..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-control border border-border bg-surface p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Cloudinary Image Attachment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    이미지 첨부 (Cloudinary 지원)
                  </label>
                  <span className="text-[10px] text-muted-foreground">선택 사항</span>
                </div>

                {newImageUrl ? (
                  <div className="relative group inline-block rounded-[10px] overflow-hidden border border-border">
                    <img src={newImageUrl} alt="Preview" className="h-28 w-auto object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewImageUrl("")}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-danger text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border/60 cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImage ? "Cloudinary 업로드 중..." : "이미지 파일 선택 (Cloudinary)"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-control px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-control bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover cursor-pointer"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={postToDelete !== null}
        title="진짜 삭제 하시겠습니까?"
        description={`'${postToDelete?.title}' 글을 삭제하시겠습니까? 삭제된 커뮤니티 글은 복구할 수 없습니다.`}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setPostToDelete(null)}
      />
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12 animate-pulse">
          <div className="h-8 w-48 bg-surface-muted rounded mb-4" />
          <div className="h-4 w-72 bg-surface-muted rounded mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-surface-muted rounded-card" />
            <div className="h-32 bg-surface-muted rounded-card" />
          </div>
        </div>
      }
    >
      <CommunityContent />
    </Suspense>
  );
}
