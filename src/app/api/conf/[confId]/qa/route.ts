import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/qa
// Returns all questions for the conference, with top-level comment counts.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const questions = await prisma.confQuestion.findMany({
      where: { confEventId: confId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Failed to fetch Q&A questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/qa
// Creates a new question. Any authenticated participant can ask.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      body?: string;
      isAnonymous?: boolean;
      authorName?: string;
    };

    const rawBody = (body.body ?? "").trim();
    if (!rawBody) {
      return NextResponse.json(
        { error: "Question body is required" },
        { status: 400 },
      );
    }

    // Determine author display name and role badge
    const user = auth.access.user;
    const role = String(user?.role ?? "USER").toUpperCase();
    const authorRole = ["SUPER_ADMIN", "ADMIN"].includes(role)
      ? role
      : "USER";
    const authorName =
      body.isAnonymous
        ? "Anonymous"
        : (body.authorName?.trim() || user?.name || "Member");

    const question = await prisma.confQuestion.create({
      data: {
        confEventId: confId,
        authorId: user?.id ?? null,
        authorName,
        authorRole,
        body: rawBody,
        isAnonymous: Boolean(body.isAnonymous),
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 },
    );
  }
}
