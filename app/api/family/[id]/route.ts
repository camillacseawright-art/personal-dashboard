import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { familyMembers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const [updated] = await db.update(familyMembers).set(body).where(eq(familyMembers.id, Number(params.id))).returning()
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(familyMembers).where(eq(familyMembers.id, Number(params.id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
