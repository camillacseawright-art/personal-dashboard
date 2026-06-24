"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessageSquare, Users, UtensilsCrossed, Home, Plane, Heart, Activity, CheckSquare, Target, BookOpen, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"

const sections = [
  { group: "Command Center", links: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "AI Assistant", icon: MessageSquare },
  ]},
  { group: "Family", links: [
    { href: "/family", label: "Family", icon: Users },
    { href: "/meals", label: "Meals & Grocery", icon: UtensilsCrossed },
    { href: "/household", label: "Household", icon: Home },
    { href: "/travel", label: "Travel", icon: Plane },
    { href: "/social", label: "Social", icon: PartyPopper },
    { href: "/health", label: "Health", icon: Heart },
  ]},
  { group: "Personal", links: [
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/habits", label: "Habits", icon: Activity },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/notes", label: "Notes", icon: BookOpen },
  ]},
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="fixed left-0 top-0 h-full w-56 border-r border-[#E8DDD0] bg-[#FAF4EC] flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-[#E8DDD0]">
        <h1 className="text-sm font-bold text-[#C8553D] tracking-wide uppercase">Family HQ</h1>
        <p className="text-xs text-[#8B7355] mt-0.5">Command Center</p>
      </div>
      <div className="flex-1 py-3 space-y-4 px-3">
        {sections.map(section => (
          <div key={section.group}>
            <p className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-widest px-2 mb-1">{section.group}</p>
            {section.links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors mb-0.5",
                  pathname === href
                    ? "bg-[#C8553D] text-white font-medium"
                    : "text-[#2C2416] hover:bg-[#F0E8DC]"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
