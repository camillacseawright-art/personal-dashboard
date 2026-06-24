import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { meals } from "@/lib/db/schema"
import { gte, asc } from "drizzle-orm"
import { format, startOfWeek } from "date-fns"

export async function GET() {
  try {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    const all = await db.select().from(meals).where(gte(meals.mealDate, weekStart)).orderBy(asc(meals.mealDate))
    return NextResponse.json(all)
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const [meal] = await db.insert(meals).values({
      mealDate: body.mealDate,
      mealType: body.mealType ?? "dinner",
      mealName: body.mealName,
      prepNotes: body.prepNotes ?? null,
      ingredients: body.ingredients ?? null,
    }).returning()
    return NextResponse.json(meal, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to add meal" }, { status: 500 })
  }
}
