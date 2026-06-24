import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { socialEvents } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(socialEvents).orderBy(asc(socialEvents.eventDate))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch social events" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [event] = await db.insert(socialEvents).values({
      personName: body.personName,
      eventType: body.eventType,
      eventDate: body.eventDate,
      giftStatus: body.giftStatus ?? "none",
      rsvpStatus: body.rsvpStatus ?? "pending",
      rsvpDeadline: body.rsvpDeadline ?? null,
      notes: body.notes ?? null,
    }).returning()
    return NextResponse.json(event, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add event" }, { status: 500 })
  }
}
