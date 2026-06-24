import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bills } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(bills).orderBy(asc(bills.dueDate))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [bill] = await db.insert(bills).values({
      name: body.name,
      amount: body.amount ?? null,
      dueDate: body.dueDate ?? null,
      isAutopay: body.isAutopay ?? false,
      frequency: body.frequency ?? "monthly",
      category: body.category ?? "other",
      notes: body.notes ?? null,
    }).returning()
    return NextResponse.json(bill, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add bill" }, { status: 500 })
  }
}
