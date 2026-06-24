import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { chatMessages, familyMembers, familySettings, tasks, bills, travelPlans, socialEvents, healthRecords, meals } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function buildSystemPrompt(): Promise<string> {
  const [settings] = await db.select().from(familySettings)
  const members = await db.select().from(familyMembers)
  const upcomingBills = await db.select().from(bills)
  const upcomingTravel = await db.select().from(travelPlans)
  const socialEvts = await db.select().from(socialEvents)
  const health = await db.select().from(healthRecords)
  const weekMeals = await db.select().from(meals)

  const familyContext = settings ? `
Family: ${settings.familyName ?? "the family"} in ${settings.city ?? "unknown city"}
Partner: ${settings.partnerName ?? "partner"}
Home: ${settings.homeAddress ?? "not set"}
Grocery service: ${settings.groceryService ?? "not set"}
` : "Family settings not yet configured."

  const membersContext = members.length > 0 ? `
Family members:
${members.map(m => `- ${m.name} (${m.role})${m.school ? `, ${m.grade ?? ""} at ${m.school}` : ""}${m.birthdate ? `, born ${m.birthdate}` : ""}`).join("\n")}
` : "No family members added yet."

  const billsContext = upcomingBills.length > 0 ? `
Bills tracked:
${upcomingBills.map(b => `- ${b.name}: $${b.amount ?? "?"} due ${b.dueDate ?? "?"} ${b.isAutopay ? "(autopay)" : "(manual)"}`).join("\n")}
` : "No bills tracked."

  const travelContext = upcomingTravel.length > 0 ? `
Upcoming travel:
${upcomingTravel.map(t => `- ${t.travelerName} → ${t.destination} (${t.departDate} to ${t.returnDate ?? "?"})`).join("\n")}
` : "No travel plans."

  const socialContext = socialEvts.length > 0 ? `
Social/birthdays:
${socialEvts.slice(0, 10).map(s => `- ${s.personName} ${s.eventType} on ${s.eventDate}`).join("\n")}
` : "No social events."

  const healthContext = health.length > 0 ? `
Health appointments:
${health.filter(h => !h.isCompleted).slice(0, 8).map(h => `- ${h.memberName}: ${h.recordType} with ${h.provider ?? "TBD"} on ${h.scheduledDate ?? "TBD"}`).join("\n")}
` : "No health records."

  const mealsContext = weekMeals.length > 0 ? `
This week's meals:
${weekMeals.map(m => `- ${m.mealDate} ${m.mealType}: ${m.mealName}`).join("\n")}
` : "No meals planned this week."

  return `You are a family operations assistant for ${settings?.familyName ?? "this family"}. You are direct, organized, and proactive. You have 6 jobs:

1. ONBOARD: If setup isn't complete, ask ONE question at a time to fill in the 8 life areas (kids/school, activities, meals/groceries, household/bills, travel, social/family, health/appointments, self/workouts). Never ask a wall of questions.

2. RUN THEIR LIFE: Parse emails, PDFs, invitations for dates, deadlines, costs, contacts, action items. Be direct. Flag urgent/overdue items FIRST.

3. WEEKLY BRIEFING: When asked for weekly brief, give: this week's events, next 30-day deadlines, 60-180 day lead-time flags, decisions needed NOW, one thing they probably forgot.

4. TRAVEL COORDINATION: Track both partners' travel. Flag solo-parenting days, childcare gaps, international trips needing passports/visas/vaccinations 90+ days out.

5. CHILD DEVELOPMENT: Track pediatrician well-visit schedule, vaccination schedule, school enrollment deadlines, camp registration windows, passport renewals.

6. DASHBOARD UPDATES: When asked to "build my dashboard" or "update my dashboard," generate a complete HTML family command center.

RULES:
- Short, direct answers. No preamble. No "I'd be happy to."
- Name the actor: "I added it" not "It has been added."
- Urgent/overdue items go FIRST.
- Remember everything told to you in this conversation.
- Never ask the same question twice.

CURRENT FAMILY DATA:
${familyContext}
${membersContext}
${billsContext}
${travelContext}
${socialContext}
${healthContext}
${mealsContext}

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

When the user asks you to "build my dashboard," generate a complete, self-contained HTML page (no external dependencies except system fonts) with the terracotta (#C8553D), sage (#87A96B), and cream (#FAF4EC) color palette, showing all sections: TODAY, URGENT, KIDS, MEALS, HOUSEHOLD, TRAVEL, SOCIAL, HEALTH, ME, with card-based layout. Output only the HTML inside a code block starting with \`\`\`html.`
}

export async function GET() {
  try {
    const messages = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt))
    return NextResponse.json(messages.reverse())
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Save user message
    await db.insert(chatMessages).values({ role: "user", content: message })

    // Get recent conversation history
    const history = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt))
    const recent = history.reverse().slice(-20) // last 20 messages for context

    const systemPrompt = await buildSystemPrompt()

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: recent.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    })

    const assistantContent = response.content[0].type === "text" ? response.content[0].text : ""

    // Save assistant message
    await db.insert(chatMessages).values({ role: "assistant", content: assistantContent })

    return NextResponse.json({ message: assistantContent })
  } catch (e: any) {
    console.error("Chat error:", e)
    return NextResponse.json({ error: e.message ?? "Failed to get response" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.delete(chatMessages)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 })
  }
}
