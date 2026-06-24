import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(tasks).orderBy(desc(tasks.createdAt))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [task] = await db
      .insert(tasks)
      .values({
        title: body.title,
        description: body.description ?? null,
        priority: body.priority ?? "medium",
        dueDate: body.dueDate ?? null,
      })
      .returning()
    return NextResponse.json(task, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
