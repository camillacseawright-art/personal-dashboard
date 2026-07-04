"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, MessageSquare, Users, UtensilsCrossed, Home, Plane, Heart, Activity, CheckSquare, Target, BookOpen, PartyPopper, Menu, X } from "lucide-react"
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

// Top 5 links shown in mobile bottom bar
const mobileBottomLinks = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/chat", label: "AI", icon: MessageSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/family", label: "Family", icon: Users },
]

export function Nav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-[#2C2416] text-[#FAF4EC] overflow-y-auto z-40">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="font-bold text-[#C8553D] text-sm uppercase tracking-widest">Family HQ</p>
          <p className="text-xs text-[#8B7355] mt-0.5">Command Center</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-4">
          {sections.map(({ group, links }) => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-widest px-2 mb-1">{group}</p>
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === href ? "bg-[#C8553D] text-white font-medium" : "text-[#C4B09A] hover:bg-white/10 hover:text-white"
                )}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#2C2416] flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-bold text-[#C8553D] text-sm uppercase tracking-widest">Family HQ</p>
        </div>
        <button onClick={() => setMobileMenuOpen(v => !v)} className="text-[#FAF4EC] p-1">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── MOBILE FULL MENU (slide-down) ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#2C2416] pt-14 overflow-y-auto">
          <nav className="px-4 py-4 space-y-4">
            {sections.map(({ group, links }) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-widest px-2 mb-1">{group}</p>
                {links.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                    pathname === href ? "bg-[#C8553D] text-white font-medium" : "text-[#C4B09A] hover:bg-white/10 hover:text-white"
                  )}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#2C2416] border-t border-white/10 flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {mobileBottomLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0",
            pathname === href ? "text-[#C8553D]" : "text-[#8B7355] hover:text-[#FAF4EC]"
          )}>
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile top bar spacer */}
      <div className="md:hidden h-12" />
    </>
  )
}
