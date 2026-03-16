import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const allProjects = await db.select().from(projects).orderBy(projects.createdAt);
  return NextResponse.json(allProjects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await db.insert(projects).values({
    id: body.id || `proj-${Date.now()}`,
    name: body.name,
    description: body.description,
    color: body.color || "#6366f1",
    repoUrl: body.repoUrl,
    vercelUrl: body.vercelUrl,
  }).returning();
  return NextResponse.json(project[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const updated = await db.update(projects)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
