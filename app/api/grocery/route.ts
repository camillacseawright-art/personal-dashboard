import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { groceryItems } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET() {
  try {
    const all = await db.select().from(groceryItems).orderBy(asc(groceryItems.category), asc(groceryItems.name))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch grocery items" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [item] = await db.insert(groceryItems).values({
      name: body.name,
      quantity: body.quantity ?? null,
      store: body.store ?? null,
      category: body.category ?? "other",
    }).returning()
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    // Clear all bought items
    await db.delete(groceryItems).where(eq(groceryItems.isBought, true))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 })
  }
}
