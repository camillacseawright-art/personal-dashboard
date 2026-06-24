import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { goals } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(goals).orderBy(desc(goals.createdAt))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [goal] = await db
      .insert(goals)
      .values({
        title: body.title,
        description: body.description ?? null,
        targetDate: body.targetDate ?? null,
        progress: body.progress ?? 0,
      })
      .returning()
    return NextResponse.json(goal, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}
