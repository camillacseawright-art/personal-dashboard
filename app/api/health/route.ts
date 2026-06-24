import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { healthRecords } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(healthRecords).orderBy(asc(healthRecords.scheduledDate))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch health records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [record] = await db.insert(healthRecords).values({
      memberName: body.memberName,
      recordType: body.recordType,
      provider: body.provider ?? null,
      scheduledDate: body.scheduledDate ?? null,
      notes: body.notes ?? null,
    }).returning()
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add health record" }, { status: 500 })
  }
}
