import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { familyMembers } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(familyMembers).orderBy(asc(familyMembers.createdAt))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch family members" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [member] = await db.insert(familyMembers).values({
      name: body.name,
      role: body.role,
      birthdate: body.birthdate ?? null,
      school: body.school ?? null,
      grade: body.grade ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      avatarColor: body.avatarColor ?? "terracotta",
      notes: body.notes ?? null,
    }).returning()
    return NextResponse.json(member, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add family member" }, { status: 500 })
  }
}
