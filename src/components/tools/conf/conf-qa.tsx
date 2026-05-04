"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Pin,
  CheckCircle2,
  Plus,
  Send,
  Trash2,
  Reply,
  ThumbsUp,
  HelpCircle,
  ShieldCheck,
  Star,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QAComment {
  id: string;
  questionId: string;
  parentId: string | null;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  isAnswer: boolean;
  upvotes: number;
  createdAt: string;
  replies: QAComment[];
}

interface QAQuestion {
  id: string;
  confEventId: string;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  isPinned: boolean;
  isAnswered: boolean;
  isAnonymous: boolean;
  upvotes: number;
  createdAt: string;
  _count?: { comments: number };
  comments?: QAComment[];
}

interface ConfQAProps {
  confId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
  currentUserName?: string;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const roleUpper = role.toUpperCase();

  if (roleUpper === "SUPER_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-[10px] font-bold text-purple-400 ring-1 ring-purple-500/30">
        <ShieldCheck className="size-2.5" />
        Super Admin
      </span>
    );
  }
  if (roleUpper === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#0B4FD9]/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-blue-500/30">
        <Star className="size-2.5" />
        Admin
      </span>
    );
  }
  if (roleUpper === "COMMITTEE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A061]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A061] ring-1 ring-[#C8A061]/30">
        Committee
      </span>
    );
  }
  if (roleUpper === "DELEGATE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
        Delegate
      </span>
    );
  }
  return null;
}

// ─── Time display ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Comment Compose Box ──────────────────────────────────────────────────────

function CommentBox({
  placeholder,
  onSubmit,
  onCancel,
  isManager,
  submitLabel = "Post reply",
}: {
  placeholder: string;
  onSubmit: (opts: { body: string; isAnswer: boolean }) => Promise<void>;
  onCancel?: () => void;
  isManager: boolean;
  submitLabel?: string;
}) {
  const [text, setText] = useState("");
  const [markAnswer, setMarkAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ body: text.trim(), isAnswer: markAnswer });
      setText("");
      setMarkAnswer(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none focus:ring-1 focus:ring-[#C8A061]/30"
      />
      <div className="flex items-center gap-3">
        {isManager && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={markAnswer}
              onChange={(e) => setMarkAnswer(e.target.checked)}
              className="h-3 w-3 rounded accent-[#C8A061]"
            />
            Mark as official answer
          </label>
        )}
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="flex items-center gap-1.5 rounded-md bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Nested Comment Node ──────────────────────────────────────────────────────

const MAX_DEPTH = 4;

function CommentNode({
  comment,
  depth,
  confId,
  questionId,
  isManager,
  isSuperAdmin,
  currentUserId,
  onDeleted,
  onReplied,
}: {
  comment: QAComment;
  depth: number;
  confId: string;
  questionId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
  currentUserId?: string;
  onDeleted: (id: string) => void;
  onReplied: (parentId: string, comment: QAComment) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const canDelete =
    isSuperAdmin ||
    isManager ||
    (currentUserId && comment.authorId === currentUserId);

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    await fetch(
      `/api/conf/${confId}/qa/${questionId}/comments?commentId=${comment.id}`,
      { method: "DELETE" },
    );
    onDeleted(comment.id);
  };

  const handleReply = async ({
    body,
    isAnswer,
  }: {
    body: string;
    isAnswer: boolean;
  }) => {
    const res = await fetch(
      `/api/conf/${confId}/qa/${questionId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId: comment.id, isAnswer }),
      },
    );
    if (!res.ok) throw new Error("Failed");
    const newComment = (await res.json()) as QAComment;
    newComment.replies = [];
    onReplied(comment.id, newComment);
    setShowReply(false);
  };

  return (
    <div
      className={`relative ${depth > 0 ? "ml-4 border-l-2 border-white/10 pl-3" : ""}`}
    >
      {/* Comment bubble */}
      <div
        className={`rounded-lg p-3 ${
          comment.isAnswer
            ? "border border-[#C8A061]/30 bg-[#C8A061]/10"
            : "bg-white/4"
        } mb-2`}
      >
        {/* Header row */}
        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
          {comment.isAnswer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A061]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A061]">
              <CheckCircle2 className="size-2.5" />
              Official Answer
            </span>
          )}
          <span className="text-xs font-semibold">{comment.authorName}</span>
          <RoleBadge role={comment.authorRole} />
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed text-foreground/90">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3">
          {depth < MAX_DEPTH && (
            <button
              onClick={() => setShowReply((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Reply className="size-3" />
              Reply
            </button>
          )}
          {comment.replies.length > 0 && (
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {collapsed ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronUp className="size-3" />
              )}
              {collapsed
                ? `Show ${comment.replies.length} repl${comment.replies.length === 1 ? "y" : "ies"}`
                : "Collapse"}
            </button>
          )}
        </div>
      </div>

      {/* Reply compose */}
      {showReply && (
        <div className="ml-4 mb-3">
          <CommentBox
            placeholder={`Reply to ${comment.authorName}…`}
            onSubmit={handleReply}
            onCancel={() => setShowReply(false)}
            isManager={isManager}
            submitLabel="Post reply"
          />
        </div>
      )}

      {/* Nested replies */}
      {!collapsed && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              confId={confId}
              questionId={questionId}
              isManager={isManager}
              isSuperAdmin={isSuperAdmin}
              currentUserId={currentUserId}
              onDeleted={onDeleted}
              onReplied={onReplied}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete a comment from a nested tree ──────────────────────────────────────

function deleteFromTree(comments: QAComment[], id: string): QAComment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: deleteFromTree(c.replies, id) }));
}

function insertReply(
  comments: QAComment[],
  parentId: string,
  newComment: QAComment,
): QAComment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...c.replies, newComment] };
    }
    return { ...c, replies: insertReply(c.replies, parentId, newComment) };
  });
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  confId,
  isManager,
  isSuperAdmin,
  currentUserId,
  onDelete,
  onPatch,
}: {
  question: QAQuestion;
  confId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onPatch: (id: string, patch: Partial<QAQuestion>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<QAComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentCount, setCommentCount] = useState(
    question._count?.comments ?? 0,
  );

  const loadComments = useCallback(async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/conf/${confId}/qa/${question.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as QAQuestion;
      setComments(data.comments ?? []);
    } finally {
      setLoadingComments(false);
    }
  }, [confId, question.id, loadingComments]);

  const handleExpand = async () => {
    if (!expanded) {
      await loadComments();
    }
    setExpanded((p) => !p);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this question and all its replies?")) return;
    await fetch(`/api/conf/${confId}/qa/${question.id}`, { method: "DELETE" });
    onDelete(question.id);
  };

  const handlePin = async () => {
    const res = await fetch(`/api/conf/${confId}/qa/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !question.isPinned }),
    });
    if (res.ok) {
      const updated = (await res.json()) as QAQuestion;
      onPatch(question.id, { isPinned: updated.isPinned });
    }
  };

  const handleMarkAnswered = async () => {
    const res = await fetch(`/api/conf/${confId}/qa/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAnswered: !question.isAnswered }),
    });
    if (res.ok) {
      const updated = (await res.json()) as QAQuestion;
      onPatch(question.id, { isAnswered: updated.isAnswered });
    }
  };

  const handleAddComment = async ({
    body,
    isAnswer,
  }: {
    body: string;
    isAnswer: boolean;
  }) => {
    const res = await fetch(
      `/api/conf/${confId}/qa/${question.id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isAnswer }),
      },
    );
    if (!res.ok) throw new Error("Failed");
    const newComment = (await res.json()) as QAComment;
    newComment.replies = [];
    setComments((prev) => [...prev, newComment]);
    setCommentCount((p) => p + 1);
    if (isAnswer) onPatch(question.id, { isAnswered: true });
    setShowCommentBox(false);
    if (!expanded) {
      setExpanded(true);
    }
  };

  const handleCommentDeleted = (deletedId: string) => {
    setComments((prev) => deleteFromTree(prev, deletedId));
    setCommentCount((p) => Math.max(0, p - 1));
  };

  const handleCommentReplied = (parentId: string, newComment: QAComment) => {
    setComments((prev) => insertReply(prev, parentId, newComment));
    setCommentCount((p) => p + 1);
  };

  const canDelete =
    isSuperAdmin ||
    isManager ||
    (currentUserId && question.authorId === currentUserId);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        question.isPinned
          ? "border-[#C8A061]/40 bg-[#C8A061]/5"
          : question.isAnswered
            ? "border-emerald-500/25 bg-emerald-950/10"
            : "border-white/10 bg-white/3"
      }`}
    >
      {/* Question Header */}
      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {question.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A061]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A061]">
              <Pin className="size-2.5" />
              Pinned
            </span>
          )}
          {question.isAnswered && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-xs text-emerald-400"
            >
              <CheckCircle2 className="mr-1 size-3" />
              Answered
            </Badge>
          )}
          <span className="text-xs font-semibold">{question.authorName}</span>
          <RoleBadge role={question.authorRole} />
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(question.createdAt)}
          </span>

          {/* Admin controls */}
          {(isManager || isSuperAdmin) && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handlePin}
                title={question.isPinned ? "Unpin" : "Pin to FAQ"}
                className="rounded p-1 text-muted-foreground hover:text-[#C8A061]"
              >
                <Pin className="size-3.5" />
              </button>
              <button
                onClick={handleMarkAnswered}
                title={question.isAnswered ? "Mark unanswered" : "Mark answered"}
                className="rounded p-1 text-muted-foreground hover:text-emerald-400"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  title="Delete question"
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          )}
          {!isManager && !isSuperAdmin && canDelete && (
            <button
              onClick={handleDelete}
              title="Delete question"
              className="ml-auto rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed">{question.body}</p>

        {/* Footer actions */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleExpand}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="size-3.5" />
            {commentCount > 0
              ? `${commentCount} comment${commentCount === 1 ? "" : "s"}`
              : "No comments yet"}
            {loadingComments ? (
              <Loader2 className="size-3 animate-spin" />
            ) : expanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>

          <button
            onClick={() => {
              setShowCommentBox((p) => !p);
              if (!expanded && !showCommentBox) {
                void loadComments().then(() => setExpanded(true));
              }
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Reply className="size-3.5" />
            {isManager ? "Answer / Reply" : "Reply"}
          </button>
        </div>
      </div>

      {/* Reply compose */}
      {showCommentBox && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <CommentBox
            placeholder={isManager ? "Write your answer or reply…" : "Write a reply…"}
            onSubmit={handleAddComment}
            onCancel={() => setShowCommentBox(false)}
            isManager={isManager}
            submitLabel={isManager ? "Post answer" : "Post reply"}
          />
        </div>
      )}

      {/* Comments section */}
      {expanded && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          {loadingComments && comments.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading comments…
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No comments yet. Be the first to reply!
            </p>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  confId={confId}
                  questionId={question.id}
                  isManager={isManager}
                  isSuperAdmin={isSuperAdmin}
                  currentUserId={currentUserId}
                  onDeleted={handleCommentDeleted}
                  onReplied={handleCommentReplied}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ConfQA({
  confId,
  isManager,
  isSuperAdmin,
  currentUserName,
}: ConfQAProps) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [askText, setAskText] = useState("");
  const [askAnonymous, setAskAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "faq" | "unanswered">(
    "all",
  );

  const loadQuestions = useCallback(async () => {
    if (!confId) return;
    try {
      const res = await fetch(`/api/conf/${confId}/qa`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as QAQuestion[];
      setQuestions(data);
    } catch {
      // Silently fail; DB may be unavailable
    } finally {
      setLoading(false);
    }
  }, [confId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    const body = askText.trim();
    if (!body) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/conf/${confId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          isAnonymous: askAnonymous,
          authorName: askAnonymous ? "Anonymous" : (currentUserName ?? "Member"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const newQuestion = (await res.json()) as QAQuestion;
      newQuestion._count = { comments: 0 };
      setQuestions((prev) => [newQuestion, ...prev]);
      setAskText("");
      setAskAnonymous(false);
      setShowAskForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handlePatch = (id: string, patch: Partial<QAQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  };

  const pinnedQuestions = questions.filter((q) => q.isPinned);
  const unansweredQuestions = questions.filter(
    (q) => !q.isPinned && !q.isAnswered,
  );
  const allQuestions = questions.filter((q) => !q.isPinned);

  const tabQuestions =
    activeTab === "faq"
      ? pinnedQuestions
      : activeTab === "unanswered"
        ? unansweredQuestions
        : allQuestions;

  return (
    <Card className="border-white/10">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="size-5 text-[#C8A061]" />
            Q&amp;A &amp; FAQ
          </CardTitle>

          <button
            onClick={() => setShowAskForm((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            {showAskForm ? (
              <>
                <X className="size-3.5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Ask a question
              </>
            )}
          </button>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Ask anything about the conference. Committee members and leaders will
          answer. Pinned questions appear in the FAQ section.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ask form */}
        {showAskForm && (
          <div className="rounded-xl border border-[#C8A061]/30 bg-[#C8A061]/5 p-4">
            <p className="mb-2 text-xs font-semibold text-[#C8A061]">
              Ask a new question
            </p>
            <form onSubmit={handleAsk} className="flex flex-col gap-2">
              <textarea
                value={askText}
                onChange={(e) => setAskText(e.target.value)}
                placeholder="What would you like to know about the conference?"
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none focus:ring-1 focus:ring-[#C8A061]/30"
              />
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={askAnonymous}
                    onChange={(e) => setAskAnonymous(e.target.checked)}
                    className="h-3 w-3 rounded accent-[#C8A061]"
                  />
                  Ask anonymously
                </label>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAskForm(false)}
                    className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!askText.trim() || submitting}
                    className="flex items-center gap-1.5 rounded-md bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {submitting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    Post question
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Pinned FAQ quick section */}
        {pinnedQuestions.length > 0 && (
          <div className="rounded-xl border border-[#C8A061]/20 bg-[#C8A061]/4 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#C8A061]">
              <Pin className="size-3.5" />
              Frequently Asked Questions
            </p>
            <div className="space-y-3">
              {pinnedQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  confId={confId}
                  isManager={isManager}
                  isSuperAdmin={isSuperAdmin}
                  onDelete={handleDelete}
                  onPatch={handlePatch}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
          {(
            [
              { key: "all", label: `All (${allQuestions.length})` },
              {
                key: "unanswered",
                label: `Unanswered (${unansweredQuestions.length})`,
              },
              ...(pinnedQuestions.length > 0
                ? [{ key: "faq", label: `FAQ (${pinnedQuestions.length})` }]
                : []),
            ] as { key: "all" | "faq" | "unanswered"; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#C8A061] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Questions list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading questions…
          </div>
        ) : tabQuestions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <MessageCircle className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {activeTab === "unanswered"
                ? "All questions have been answered!"
                : "No questions yet. Be the first to ask!"}
            </p>
            {!showAskForm && (
              <button
                onClick={() => setShowAskForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#C8A061]/40 px-3 py-1.5 text-xs font-semibold text-[#C8A061] hover:bg-[#C8A061]/10"
              >
                <Plus className="size-3.5" />
                Ask a question
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tabQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                confId={confId}
                isManager={isManager}
                isSuperAdmin={isSuperAdmin}
                onDelete={handleDelete}
                onPatch={handlePatch}
              />
            ))}
          </div>
        )}

        {/* Upvote hint */}
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
          <ThumbsUp className="size-3" />
          Committee members and leaders can pin questions or mark official answers
        </p>
      </CardContent>
    </Card>
  );
}
