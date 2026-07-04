import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { chatMessages, familyMembers, familySettings, tasks, bills, travelPlans, socialEvents, healthRecords, meals } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOLS: Anthropic.Tool[] = [
  {
    name: "add_task",
    description: "Add a task or to-do item to the user's task list in the dashboard",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "The task title" },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
        notes: { type: "string", description: "Optional notes" },
      },
      required: ["title"],
    },
  },
  {
    name: "add_health_record",
    description: "Add a health appointment, vaccination, or medical record to the dashboard",
    input_schema: {
      type: "object" as const,
      properties: {
        memberName: { type: "string", description: "Name of the family member" },
        recordType: { type: "string", enum: ["appointment", "well-visit", "vaccination", "dentist", "prescription", "therapy", "specialist", "checkup"] },
        provider: { type: "string", description: "Doctor or provider name" },
        scheduledDate: { type: "string", description: "Date in YYYY-MM-DD format" },
        notes: { type: "string", description: "Additional notes" },
      },
      required: ["memberName", "recordType"],
    },
  },
  {
    name: "add_bill",
    description: "Add a bill or subscription to the household tracker",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Bill name" },
        amount: { type: "string", description: "Amount in dollars" },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
        isAutopay: { type: "boolean", description: "Whether it's on autopay" },
        frequency: { type: "string", enum: ["monthly", "annual", "weekly", "one-time"] },
        category: { type: "string", enum: ["utilities", "mortgage/rent", "insurance", "subscription", "internet", "phone", "grocery", "childcare", "medical", "other"] },
      },
      required: ["name"],
    },
  },
  {
    name: "add_social_event",
    description: "Add a birthday, RSVP, visit, or social event to the calendar",
    input_schema: {
      type: "object" as const,
      properties: {
        personName: { type: "string", description: "Person or event name" },
        eventType: { type: "string", enum: ["birthday", "anniversary", "rsvp", "visit", "holiday"] },
        eventDate: { type: "string", description: "Date in YYYY-MM-DD format" },
        notes: { type: "string", description: "Gift ideas, location, etc." },
        rsvpDeadline: { type: "string", description: "RSVP deadline in YYYY-MM-DD format" },
      },
      required: ["personName", "eventType", "eventDate"],
    },
  },
  {
    name: "add_travel",
    description: "Add a trip or travel plan for a family member",
    input_schema: {
      type: "object" as const,
      properties: {
        travelerName: { type: "string", description: "Who is traveling" },
        destination: { type: "string", description: "Where they're going" },
        departDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
        returnDate: { type: "string", description: "Return date in YYYY-MM-DD format" },
        tripType: { type: "string", enum: ["personal", "work", "family"] },
        notes: { type: "string", description: "Flight info, hotel, notes" },
      },
      required: ["travelerName", "destination", "departDate"],
    },
  },
]

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === "add_task") {
      const [row] = await db.insert(tasks).values({ title: input.title as string, priority: (input.priority as string) ?? "medium", dueDate: input.dueDate as string, notes: input.notes as string }).returning()
      return `Task added: "${row.title}"`
    }
    if (name === "add_health_record") {
      const [row] = await db.insert(healthRecords).values({ memberName: input.memberName as string, recordType: (input.recordType as string) ?? "appointment", provider: input.provider as string, scheduledDate: input.scheduledDate as string, notes: input.notes as string }).returning()
      return `Health record added: ${row.recordType} for ${row.memberName}`
    }
    if (name === "add_bill") {
      const [row] = await db.insert(bills).values({ name: input.name as string, amount: input.amount as string, dueDate: input.dueDate as string, isAutopay: (input.isAutopay as boolean) ?? false, frequency: (input.frequency as string) ?? "monthly", category: (input.category as string) ?? "other" }).returning()
      return `Bill added: ${row.name}`
    }
    if (name === "add_social_event") {
      const [row] = await db.insert(socialEvents).values({ personName: input.personName as string, eventType: (input.eventType as string) ?? "birthday", eventDate: input.eventDate as string, notes: input.notes as string, rsvpDeadline: input.rsvpDeadline as string }).returning()
      return `Event added: ${row.personName} on ${row.eventDate}`
    }
    if (name === "add_travel") {
      const [row] = await db.insert(travelPlans).values({ travelerName: input.travelerName as string, destination: input.destination as string, departDate: input.departDate as string, returnDate: input.returnDate as string, tripType: (input.tripType as string) ?? "personal", notes: input.notes as string }).returning()
      return `Trip added: ${row.travelerName} → ${row.destination}`
    }
    return "Unknown tool"
  } catch (e: any) {
    return `Error: ${e.message}`
  }
}

async function buildSystemPrompt(): Promise<string> {
  const [settings] = await db.select().from(familySettings)
  const members = await db.select().from(familyMembers)
  const upcomingBills = await db.select().from(bills)
  const upcomingTravel = await db.select().from(travelPlans)
  const socialEvts = await db.select().from(socialEvents)
  const health = await db.select().from(healthRecords)
  const weekMeals = await db.select().from(meals)

  const familyContext = settings ? `Family: ${settings.familyName ?? "the family"} in ${settings.city ?? "unknown city"}\nPartner: ${settings.partnerName ?? "partner"}` : "Family settings not yet configured."
  const membersContext = members.length > 0 ? `Family members:\n${members.map(m => `- ${m.name} (${m.role})${m.school ? `, ${m.grade ?? ""} at ${m.school}` : ""}${m.birthdate ? `, born ${m.birthdate}` : ""}`).join("\n")}` : "No family members added yet."
  const billsContext = upcomingBills.length > 0 ? `Bills:\n${upcomingBills.map(b => `- ${b.name}: $${b.amount ?? "?"} due ${b.dueDate ?? "?"} ${b.isAutopay ? "(autopay)" : "(manual)"}`).join("\n")}` : "No bills tracked."
  const travelContext = upcomingTravel.length > 0 ? `Travel:\n${upcomingTravel.map(t => `- ${t.travelerName} → ${t.destination} (${t.departDate} to ${t.returnDate ?? "?"})`).join("\n")}` : "No travel plans."
  const socialContext = socialEvts.length > 0 ? `Social:\n${socialEvts.slice(0, 10).map(s => `- ${s.personName} ${s.eventType} on ${s.eventDate}`).join("\n")}` : "No social events."
  const healthContext = health.filter(h => !h.isCompleted).length > 0 ? `Health:\n${health.filter(h => !h.isCompleted).slice(0, 8).map(h => `- ${h.memberName}: ${h.recordType} with ${h.provider ?? "TBD"} on ${h.scheduledDate ?? "TBD"}`).join("\n")}` : "No health records."
  const mealsContext = weekMeals.length > 0 ? `Meals:\n${weekMeals.map(m => `- ${m.mealDate} ${m.mealType}: ${m.mealName}`).join("\n")}` : "No meals planned."

  return `You are a family operations assistant. You are direct, organized, and proactive. You have access to tools to ADD items directly to the family dashboard — use them whenever the user mentions something that should be tracked.

Your 6 jobs:
1. ONBOARD: Ask ONE question at a time across 8 life areas (kids/school, activities, meals/groceries, household/bills, travel, social/family, health/appointments, self). Never ask a wall of questions.
2. RUN THEIR LIFE: Parse emails, PDFs, invitations for dates, deadlines, costs, contacts. Flag urgent/overdue items FIRST.
3. WEEKLY BRIEFING: When asked, give: this week, next 30 days, 60-180 day flags, decisions needed NOW, one thing they forgot.
4. TRAVEL COORDINATION: Flag solo-parenting days, childcare gaps, international trips 90+ days out.
5. CHILD DEVELOPMENT: Track pediatrician schedule, vaccinations, school deadlines, camp registration, passport renewals.
6. DASHBOARD UPDATES: When asked to "build my dashboard," generate complete HTML with terracotta/sage/cream palette.

RULES:
- Short, direct answers. No preamble. No "I'd be happy to."
- Use tools immediately when the user mentions something to track — don't ask permission, just do it and confirm.
- Urgent/overdue items go FIRST.
- Never ask the same question twice.

CURRENT DATA:
${familyContext}
${membersContext}
${billsContext}
${travelContext}
${socialContext}
${healthContext}
${mealsContext}

Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
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
    await db.insert(chatMessages).values({ role: "user", content: message })

    const history = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt))
    const recent = history.reverse().slice(-20)
    const systemPrompt = await buildSystemPrompt()

    const apiMessages: Anthropic.MessageParam[] = recent.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))

    // Agentic loop — let Claude use tools until it's done
    let finalText = ""
    let currentMessages = [...apiMessages]

    while (true) {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOLS,
        messages: currentMessages,
      })

      if (response.stop_reason === "end_turn") {
        finalText = response.content.filter(b => b.type === "text").map(b => (b as Anthropic.TextBlock).text).join("")
        break
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(b => b.type === "tool_use") as Anthropic.ToolUseBlock[]
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const tool of toolUseBlocks) {
          const result = await executeTool(tool.name, tool.input as Record<string, unknown>)
          toolResults.push({ type: "tool_result", tool_use_id: tool.id, content: result })
        }

        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: response.content },
          { role: "user" as const, content: toolResults },
        ]
        continue
      }

      // Fallback
      finalText = response.content.filter(b => b.type === "text").map(b => (b as Anthropic.TextBlock).text).join("")
      break
    }

    await db.insert(chatMessages).values({ role: "assistant", content: finalText })
    return NextResponse.json({ message: finalText })
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
