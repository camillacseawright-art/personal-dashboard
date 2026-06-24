import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { habits, habitLogs } from "@/lib/db/schema"
import { desc, gte } from "drizzle-orm"

export async function GET() {
  try {
    const allHabits = await db.select().from(habits).orderBy(desc(habits.createdAt))
    // Fetch last 35 days of logs for streak calculation
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 35)
    const cutoffStr = cutoff.toISOString().split("T")[0]
    const logs = await db.select().from(habitLogs).where(gte(habitLogs.completedDate, cutoffStr))
    return NextResponse.json({ habits: allHabits, logs })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [habit] = await db
      .insert(habits)
      .values({
        name: body.name,
        description: body.description ?? null,
        color: body.color ?? "blue",
        frequency: body.frequency ?? "daily",
      })
      .returning()
    return NextResponse.json(habit, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 })
  }
}
