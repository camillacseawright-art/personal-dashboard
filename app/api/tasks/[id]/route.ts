import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const [updated] = await db
      .update(tasks)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tasks.id, Number(params.id)))
      .returning()
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(tasks).where(eq(tasks.id, Number(params.id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
