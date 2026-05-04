import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// Recursively load nested comments up to 4 levels deep.
async function loadCommentTree(questionId: string) {
  // Fetch all comments for this question in one query, then build tree in memory.
  const all = await prisma.confQAComment.findMany({
    where: { questionId },
    orderBy: { createdAt: "asc" },
  });

  type CommentWithReplies = (typeof all)[0] & { replies: CommentWithReplies[] };

  const map = new Map<string, CommentWithReplies>();
  all.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  const roots: CommentWithReplies[] = [];
  all.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId) {
      map.get(c.parentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// GET /api/conf/[confId]/qa/[questionId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string; questionId: string }> },
) {
  try {
    const { confId, questionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const question = await prisma.confQuestion.findFirst({
      where: { id: questionId, confEventId: confId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const comments = await loadCommentTree(questionId);
    return NextResponse.json({ ...question, comments });
  } catch (error) {
    console.error("Failed to fetch question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/qa/[questionId]
// Admin+ can pin/unpin or mark as answered/unanswered.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; questionId: string }> },
) {
  try {
    const { confId, questionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      isPinned?: boolean;
      isAnswered?: boolean;
    };

    const updated = await prisma.confQuestion.update({
      where: { id: questionId },
      data: {
        ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
        ...(body.isAnswered !== undefined && { isAnswered: body.isAnswered }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/qa/[questionId]
// Admin+ can delete any question; authors can delete their own.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; questionId: string }> },
) {
  try {
    const { confId, questionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const question = await prisma.confQuestion.findFirst({
      where: { id: questionId, confEventId: confId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const role = String(auth.access.user?.role ?? "USER").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role);
    const isOwner = auth.access.user?.id && question.authorId === auth.access.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.confQuestion.delete({ where: { id: questionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
