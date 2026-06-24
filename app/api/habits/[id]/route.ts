import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { habits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(habits).where(eq(habits.id, Number(params.id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 })
  }
}
