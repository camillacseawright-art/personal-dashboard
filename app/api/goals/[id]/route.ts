import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { goals } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const [updated] = await db
      .update(goals)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(goals.id, Number(params.id)))
      .returning()
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(goals).where(eq(goals.id, Number(params.id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}
