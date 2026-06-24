import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notes } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(notes).orderBy(desc(notes.noteDate))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}
