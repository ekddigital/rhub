import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// POST /api/conf/[confId]/qa/[questionId]/comments
// Any participant can comment; managers can mark isAnswer.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; questionId: string }> },
) {
  try {
    const { confId, questionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      body?: string;
      parentId?: string | null;
      isAnonymous?: boolean;
      authorName?: string;
      isAnswer?: boolean;
    };

    const rawBody = (body.body ?? "").trim();
    if (!rawBody) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 },
      );
    }

    // Verify question belongs to this conf
    const question = await prisma.confQuestion.findFirst({
      where: { id: questionId, confEventId: confId },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    // Verify parentId if provided
    if (body.parentId) {
      const parentExists = await prisma.confQAComment.findFirst({
        where: { id: body.parentId, questionId },
        select: { id: true },
      });
      if (!parentExists) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 },
        );
      }
    }

    const user = auth.access.user;
    const userRole = String(user?.role ?? "USER").toUpperCase();
    const isManager = [
      "SUPER_ADMIN",
      "ADMIN",
      "JUDGE_ADMIN",
      "HEAD_JUDGE",
    ].includes(userRole);

    // Only managers can mark a comment as an official answer
    const markAsAnswer = Boolean(body.isAnswer) && isManager;

    const authorRole = ["SUPER_ADMIN", "ADMIN"].includes(userRole)
      ? userRole
      : isManager
        ? "COMMITTEE"
        : "USER";

    const authorName = body.isAnonymous
      ? "Anonymous"
      : body.authorName?.trim() || user?.name || "Member";

    const comment = await prisma.confQAComment.create({
      data: {
        questionId,
        parentId: body.parentId ?? null,
        authorId: user?.id ?? null,
        authorName,
        authorRole,
        body: rawBody,
        isAnswer: markAsAnswer,
      },
    });

    // If marked as official answer, flag the question as answered
    if (markAsAnswer) {
      await prisma.confQuestion.update({
        where: { id: questionId },
        data: { isAnswered: true },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/qa/[questionId]/comments?commentId=xxx
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ confId: string; questionId: string }> },
) {
  try {
    const { confId, questionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 },
      );
    }

    const comment = await prisma.confQAComment.findFirst({
      where: { id: commentId, questionId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const role = String(auth.access.user?.role ?? "USER").toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role);
    const isOwner =
      auth.access.user?.id && comment.authorId === auth.access.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.confQAComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/qa/[questionId]/comments
// Any participant can upvote a comment.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; questionId: string }> },
) {
  try {
    const { confId, questionId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as { commentId?: string };
    if (!body.commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 },
      );
    }

    const comment = await prisma.confQAComment.findFirst({
      where: { id: body.commentId, questionId },
      select: { id: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const updated = await prisma.confQAComment.update({
      where: { id: body.commentId },
      data: { upvotes: { increment: 1 } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to upvote comment:", error);
    return NextResponse.json(
      { error: "Failed to upvote comment" },
      { status: 500 },
    );
  }
}
