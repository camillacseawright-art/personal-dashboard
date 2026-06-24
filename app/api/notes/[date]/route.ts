import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(_: Request, { params }: { params: { date: string } }) {
  try {
    const [note] = await db.select().from(notes).where(eq(notes.noteDate, params.date))
    return NextResponse.json(note ?? null)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { date: string } }) {
  try {
    const body = await req.json()
    const existing = await db.select().from(notes).where(eq(notes.noteDate, params.date))
    if (existing.length > 0) {
      const [updated] = await db
        .update(notes)
        .set({ content: body.content, updatedAt: new Date() })
        .where(eq(notes.noteDate, params.date))
        .returning()
      return NextResponse.json(updated)
    }
    const [created] = await db
      .insert(notes)
      .values({ noteDate: params.date, content: body.content })
      .returning()
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { date: string } }) {
  try {
    await db.delete(notes).where(eq(notes.noteDate, params.date))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
