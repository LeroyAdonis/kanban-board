import { db } from "@/db";
import { kanbanTasks, COLUMNS } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  
  const query = projectId
    ? db.select().from(kanbanTasks).where(eq(kanbanTasks.projectId, projectId))
    : db.select().from(kanbanTasks);
  
  const tasks = await query;
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const task = await db.insert(kanbanTasks).values({
    id: body.id || `task-${Date.now()}`,
    projectId: body.projectId,
    title: body.title,
    description: body.description,
    column: body.column || "backlog",
    priority: body.priority || "medium",
    assignee: body.assignee,
    tags: body.tags || [],
    storyPoints: body.storyPoints,
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
  }).returning();
  return NextResponse.json(task[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  
  // Enforce single-step column movement
  if (updates.column) {
    const current = await db.select().from(kanbanTasks).where(eq(kanbanTasks.id, id));
    if (current.length > 0) {
      const currentIdx = COLUMNS.indexOf(current[0].column as typeof COLUMNS[number]);
      const targetIdx = COLUMNS.indexOf(updates.column);
      if (targetIdx !== currentIdx + 1 && targetIdx !== currentIdx) {
        return NextResponse.json(
          { error: `Cards may only move one column at a time. Current: ${current[0].column}` },
          { status: 400 }
        );
      }
      // Block moving to done without verification (can be overridden)
      if (updates.column === "done" && !body.verified) {
        return NextResponse.json(
          { error: "Cannot move to done without verification. Set verified=true to override." },
          { status: 400 }
        );
      }
    }
  }
  
  const updated = await db.update(kanbanTasks)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(kanbanTasks.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(kanbanTasks).where(eq(kanbanTasks.id, id));
  return NextResponse.json({ ok: true });
}
