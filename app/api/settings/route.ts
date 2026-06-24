import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { familySettings } from "@/lib/db/schema"

export async function GET() {
  try {
    const [settings] = await db.select().from(familySettings)
    return NextResponse.json(settings ?? null)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const existing = await db.select().from(familySettings)
    if (existing.length > 0) {
      const [updated] = await db.update(familySettings).set({ ...body, updatedAt: new Date() }).returning()
      return NextResponse.json(updated)
    }
    const [created] = await db.insert(familySettings).values({ ...body }).returning()
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
