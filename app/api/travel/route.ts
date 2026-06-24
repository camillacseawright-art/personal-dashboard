import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { travelPlans } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(travelPlans).orderBy(asc(travelPlans.departDate))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch travel plans" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [plan] = await db.insert(travelPlans).values({
      travelerName: body.travelerName,
      destination: body.destination,
      departDate: body.departDate,
      returnDate: body.returnDate ?? null,
      tripType: body.tripType ?? "personal",
      notes: body.notes ?? null,
    }).returning()
    return NextResponse.json(plan, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add travel plan" }, { status: 500 })
  }
}
