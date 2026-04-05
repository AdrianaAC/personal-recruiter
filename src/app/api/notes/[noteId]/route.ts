import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validations/note";

type RouteContext = {
  params: Promise<{
    noteId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await context.params;

    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        application: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updatedNote = await prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        title: data.title || null,
        content: data.content,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedNote, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/notes/[noteId] error:", error);

    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await context.params;

    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        application: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await prisma.note.delete({
      where: {
        id: noteId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/notes/[noteId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
