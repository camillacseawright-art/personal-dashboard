import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { habitLogs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { todayISO } from "@/lib/utils"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const today = todayISO()
    const existing = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, Number(params.id)), eq(habitLogs.completedDate, today)))
    if (existing.length > 0) {
      await db
        .delete(habitLogs)
        .where(and(eq(habitLogs.habitId, Number(params.id)), eq(habitLogs.completedDate, today)))
      return NextResponse.json({ toggled: false })
    }
    await db.insert(habitLogs).values({ habitId: Number(params.id), completedDate: today })
    return NextResponse.json({ toggled: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to toggle habit log" }, { status: 500 })
  }
}
