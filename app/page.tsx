"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { format, differenceInDays, parseISO, isToday, isTomorrow, addDays } from "date-fns"
import { AlertTriangle, Clock, Plane, Heart, UtensilsCrossed, Home, PartyPopper, Users, ArrowRight, CheckSquare, Calendar, ExternalLink } from "lucide-react"
import { cn, todayISO } from "@/lib/utils"
import type { FamilyMember, Bill, TravelPlan, SocialEvent, HealthRecord, Meal, Task, FamilySettings } from "@/lib/db/schema"

// ── Color palette ──────────────────────────────────────────────────────────────
const T = { // terracotta
  bg: "bg-[#C8553D]", text: "text-[#C8553D]", border: "border-[#C8553D]", light: "bg-[#F5E6E3]",
}
const S = { // sage
  bg: "bg-[#87A96B]", text: "text-[#87A96B]", border: "border-[#87A96B]", light: "bg-[#EBF2E5]",
}

function SectionCard({ title, icon: Icon, color, children, href, className }: {
  title: string; icon: React.ElementType; color: "terracotta" | "sage"; children: React.ReactNode; href?: string; className?: string
}) {
  const c = color === "terracotta" ? T : S
  return (
    <div className={cn("bg-white rounded-xl border border-[#E8DDD0] shadow-sm overflow-hidden", className)}>
      <div className={cn("flex items-center justify-between px-4 py-3", c.light)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", c.text)} />
          <h2 className={cn("text-sm font-bold uppercase tracking-wide", c.text)}>{title}</h2>
        </div>
        {href && (
          <Link href={href} className={cn("text-xs flex items-center gap-1", c.text, "hover:opacity-70")}>
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function UrgencyBadge({ daysUntil }: { daysUntil: number }) {
  if (daysUntil < 0) return <span className="text-xs font-bold text-white bg-[#C8553D] px-1.5 py-0.5 rounded">OVERDUE</span>
  if (daysUntil === 0) return <span className="text-xs font-bold text-white bg-[#C8553D] px-1.5 py-0.5 rounded">TODAY</span>
  if (daysUntil === 1) return <span className="text-xs font-bold text-white bg-[#C8553D] px-1.5 py-0.5 rounded">TOMORROW</span>
  if (daysUntil <= 3) return <span className="text-xs font-bold bg-[#D4A574] text-white px-1.5 py-0.5 rounded">{daysUntil}d</span>
  return <span className="text-xs font-medium bg-[#EBF2E5] text-[#87A96B] px-1.5 py-0.5 rounded">{daysUntil}d</span>
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-[#8B7355] italic py-2">{text}</p>
}

export default function CommandCenter() {
  const today = todayISO()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [travel, setTravel] = useState<TravelPlan[]>([])
  const [social, setSocial] = useState<SocialEvent[]>([])
  const [health, setHealth] = useState<HealthRecord[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<FamilySettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/family").then(r => r.json()),
      fetch("/api/bills").then(r => r.json()),
      fetch("/api/travel").then(r => r.json()),
      fetch("/api/social").then(r => r.json()),
      fetch("/api/health").then(r => r.json()),
      fetch("/api/meals").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([m, b, tr, s, h, me, t, st]) => {
      setMembers(Array.isArray(m) ? m : [])
      setBills(Array.isArray(b) ? b : [])
      setTravel(Array.isArray(tr) ? tr : [])
      setSocial(Array.isArray(s) ? s : [])
      setHealth(Array.isArray(h) ? h : [])
      setMeals(Array.isArray(me) ? me : [])
      setTasks(Array.isArray(t) ? t : [])
      setSettings(st)
      setLoading(false)
    })
  }, [])

  // Derived data
  const dueBills = bills.filter(b => b.dueDate && !b.isPaid && differenceInDays(parseISO(b.dueDate), new Date()) <= 14)
  const upcomingTravel = travel.filter(t => t.departDate && differenceInDays(parseISO(t.departDate), new Date()) >= 0)
  const upcomingSocial = social.filter(s => {
    const d = differenceInDays(parseISO(s.eventDate), new Date())
    return d >= 0 && d <= 30
  })
  const upcomingHealth = health.filter(h => !h.isCompleted && h.scheduledDate)
  const todaysMeals = meals.filter(m => m.mealDate === today)
  const openTasks = tasks.filter(t => t.status === "todo")
  const kids = members.filter(m => m.role === "kid")

  // Urgent items (next 72h)
  const urgentItems: Array<{ label: string; daysUntil: number; type: string }> = [
    ...dueBills.filter(b => {
      const d = differenceInDays(parseISO(b.dueDate!), new Date())
      return d <= 3
    }).map(b => ({ label: `${b.name} — $${b.amount ?? "?"}`, daysUntil: differenceInDays(parseISO(b.dueDate!), new Date()), type: "bill" })),
    ...social.filter(s => s.rsvpDeadline && differenceInDays(parseISO(s.rsvpDeadline), new Date()) <= 3 && s.rsvpStatus === "pending")
      .map(s => ({ label: `RSVP for ${s.personName}`, daysUntil: differenceInDays(parseISO(s.rsvpDeadline!), new Date()), type: "rsvp" })),
    ...upcomingTravel.filter(t => differenceInDays(parseISO(t.departDate), new Date()) <= 3)
      .map(t => ({ label: `${t.travelerName} departs to ${t.destination}`, daysUntil: differenceInDays(parseISO(t.departDate), new Date()), type: "travel" })),
  ].sort((a, b) => a.daysUntil - b.daysUntil)

  // Status line
  const statusParts = []
  if (openTasks.length) statusParts.push(`${openTasks.length} open task${openTasks.length !== 1 ? "s" : ""}`)
  if (dueBills.length) statusParts.push(`${dueBills.length} bill${dueBills.length !== 1 ? "s" : ""} due soon`)
  if (urgentItems.length) statusParts.push(`${urgentItems.length} urgent item${urgentItems.length !== 1 ? "s" : ""}`)
  const statusLine = statusParts.length > 0 ? statusParts.join(" · ") : "All clear — nothing urgent"

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-white rounded-xl border border-[#E8DDD0]" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white rounded-xl border border-[#E8DDD0]" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-5">
      {/* HEADER */}
      <div className="bg-[#C8553D] text-white rounded-xl px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{settings?.familyName ? `${settings.familyName} Command Center` : "Family Command Center"}</h1>
          <p className="text-sm opacity-80 mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">{statusLine}</p>
          <Link href="/chat" className="text-xs opacity-70 hover:opacity-100 underline mt-1 block">Ask the AI assistant →</Link>
        </div>
      </div>

      {/* URGENT */}
      {urgentItems.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-[#C8553D] shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#F5E6E3]">
            <AlertTriangle className="h-4 w-4 text-[#C8553D]" />
            <h2 className="text-sm font-bold text-[#C8553D] uppercase tracking-wide">Urgent — Next 72 Hours</h2>
          </div>
          <div className="p-4 space-y-2">
            {urgentItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#2C2416] font-medium">{item.label}</span>
                <UrgencyBadge daysUntil={item.daysUntil} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* KIDS */}
        {kids.length > 0 ? (
          <SectionCard title="Kids" icon={Users} color="terracotta" href="/family">
            <div className="space-y-4">
              {kids.map(kid => {
                const kidHealth = upcomingHealth.filter(h => h.memberName === kid.name)
                return (
                  <div key={kid.id} className="border-l-2 border-[#C8553D] pl-3">
                    <p className="font-semibold text-sm text-[#2C2416]">{kid.name}
                      {kid.school && <span className="text-xs text-[#8B7355] font-normal ml-2">{kid.grade ? `${kid.grade} · ` : ""}{kid.school}</span>}
                    </p>
                    {kidHealth.length > 0 ? kidHealth.slice(0, 2).map(h => (
                      <p key={h.id} className="text-xs text-[#8B7355] mt-0.5">
                        🩺 {h.recordType} with {h.provider ?? "TBD"} — {h.scheduledDate ? format(parseISO(h.scheduledDate), "MMM d") : "TBD"}
                      </p>
                    )) : <p className="text-xs text-[#8B7355] mt-0.5">No upcoming appointments</p>}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Kids" icon={Users} color="terracotta" href="/family">
            <Empty text="Add family members to see kid cards." />
            <Link href="/family" className="text-sm text-[#C8553D] hover:underline mt-2 block">+ Add family members</Link>
          </SectionCard>
        )}

        {/* MEALS */}
        <SectionCard title="Meals" icon={UtensilsCrossed} color="sage" href="/meals">
          {todaysMeals.length > 0 ? (
            <div className="space-y-2">
              {todaysMeals.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-xs text-[#87A96B] font-medium uppercase w-16">{m.mealType}</span>
                  <span className="text-sm text-[#2C2416] font-medium">{m.mealName}</span>
                </div>
              ))}
              {meals.filter(m => m.mealDate > today).slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center gap-2 opacity-60">
                  <span className="text-xs text-[#87A96B] font-medium uppercase w-16">{format(parseISO(m.mealDate), "EEE")}</span>
                  <span className="text-sm text-[#2C2416]">{m.mealName}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Empty text="No meals planned yet." />
              <Link href="/meals" className="text-sm text-[#87A96B] hover:underline mt-2 block">+ Plan meals</Link>
            </>
          )}
        </SectionCard>

        {/* HOUSEHOLD / BILLS */}
        <SectionCard title="Household" icon={Home} color="terracotta" href="/household">
          {dueBills.length > 0 ? (
            <div className="space-y-2">
              {dueBills.slice(0, 5).map(bill => {
                const d = differenceInDays(parseISO(bill.dueDate!), new Date())
                return (
                  <div key={bill.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-[#2C2416]">{bill.name}</span>
                      {bill.isAutopay && <span className="text-xs text-[#87A96B] ml-2">autopay</span>}
                      {bill.amount && <span className="text-xs text-[#8B7355] ml-2">${bill.amount}</span>}
                    </div>
                    <UrgencyBadge daysUntil={d} />
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <Empty text="No bills due in the next 14 days." />
              <Link href="/household" className="text-sm text-[#C8553D] hover:underline mt-2 block">+ Track bills</Link>
            </>
          )}
        </SectionCard>

        {/* TRAVEL */}
        <SectionCard title="Travel" icon={Plane} color="sage" href="/travel">
          {upcomingTravel.length > 0 ? (
            <div className="space-y-3">
              {upcomingTravel.slice(0, 3).map(t => {
                const d = differenceInDays(parseISO(t.departDate), new Date())
                return (
                  <div key={t.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2C2416]">{t.travelerName} → {t.destination}</p>
                      <p className="text-xs text-[#8B7355]">{format(parseISO(t.departDate), "MMM d")}
                        {t.returnDate ? ` – ${format(parseISO(t.returnDate), "MMM d")}` : ""}
                        <span className={cn("ml-2 capitalize", t.tripType === "work" ? "text-[#87A96B]" : "text-[#C8553D]")}>{t.tripType}</span>
                      </p>
                    </div>
                    <UrgencyBadge daysUntil={d} />
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <Empty text="No upcoming travel." />
              <Link href="/travel" className="text-sm text-[#87A96B] hover:underline mt-2 block">+ Add travel</Link>
            </>
          )}
        </SectionCard>

        {/* SOCIAL */}
        <SectionCard title="Social & Birthdays" icon={PartyPopper} color="terracotta" href="/social">
          {upcomingSocial.length > 0 ? (
            <div className="space-y-2">
              {upcomingSocial.slice(0, 5).map(s => {
                const d = differenceInDays(parseISO(s.eventDate), new Date())
                return (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-[#2C2416]">{s.personName}</span>
                      <span className="text-xs text-[#8B7355] ml-2 capitalize">{s.eventType}</span>
                      {s.eventType === "birthday" && s.giftStatus === "none" && (
                        <span className="text-xs text-[#C8553D] ml-2">🎁 gift needed</span>
                      )}
                      {s.rsvpStatus === "pending" && s.rsvpDeadline && (
                        <span className="text-xs text-[#D4A574] ml-2">RSVP pending</span>
                      )}
                    </div>
                    <UrgencyBadge daysUntil={d} />
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <Empty text="No events in the next 30 days." />
              <Link href="/social" className="text-sm text-[#C8553D] hover:underline mt-2 block">+ Add birthdays & events</Link>
            </>
          )}
        </SectionCard>

        {/* HEALTH */}
        <SectionCard title="Health" icon={Heart} color="sage" href="/health">
          {upcomingHealth.length > 0 ? (
            <div className="space-y-2">
              {upcomingHealth.slice(0, 5).map(h => {
                const d = h.scheduledDate ? differenceInDays(parseISO(h.scheduledDate), new Date()) : 999
                return (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-[#2C2416]">{h.memberName}</span>
                      <span className="text-xs text-[#8B7355] ml-2 capitalize">{h.recordType}</span>
                      {h.provider && <span className="text-xs text-[#8B7355] ml-1">· {h.provider}</span>}
                    </div>
                    {h.scheduledDate ? <UrgencyBadge daysUntil={d} /> : <span className="text-xs text-[#8B7355]">TBD</span>}
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <Empty text="No upcoming appointments." />
              <Link href="/health" className="text-sm text-[#87A96B] hover:underline mt-2 block">+ Track appointments</Link>
            </>
          )}
        </SectionCard>

        {/* ME / TASKS */}
        <SectionCard title="Open Tasks" icon={CheckSquare} color="terracotta" href="/tasks" className="lg:col-span-2">
          {openTasks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {openTasks.slice(0, 8).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0",
                    task.priority === "high" ? "bg-[#C8553D]" : task.priority === "medium" ? "bg-[#D4A574]" : "bg-[#87A96B]"
                  )} />
                  <span className="text-[#2C2416] truncate">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-xs text-[#8B7355] ml-auto flex-shrink-0">{format(parseISO(task.dueDate), "MMM d")}</span>
                  )}
                </div>
              ))}
              {openTasks.length > 8 && (
                <Link href="/tasks" className="text-xs text-[#8B7355] hover:text-[#C8553D]">+{openTasks.length - 8} more</Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#87A96B] font-medium">✓ All tasks complete — nothing open</p>
          )}
        </SectionCard>
      </div>

      {/* QUICK ACTIONS FOOTER */}
      <div className="bg-white rounded-xl border border-[#E8DDD0] p-4">
        <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-3">Quick Links</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Gmail", href: "https://mail.google.com" },
            { label: "Google Calendar", href: "https://calendar.google.com" },
            { label: "AI Assistant", href: "/chat" },
            { label: "Add Task", href: "/tasks" },
            { label: "Plan Meals", href: "/meals" },
            { label: "Travel", href: "/travel" },
          ].map(link => (
            <a key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined}
              className="flex items-center gap-1 text-xs bg-[#FAF4EC] border border-[#E8DDD0] text-[#2C2416] px-3 py-1.5 rounded-full hover:bg-[#F0E8DC] transition-colors">
              {link.label}
              {link.href.startsWith("http") && <ExternalLink className="h-2.5 w-2.5 opacity-50" />}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
