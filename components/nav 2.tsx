"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, Target, BookOpen, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: Activity },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Target },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 h-full w-56 border-r border-neutral-100 bg-white flex flex-col p-4 gap-1">
      <div className="pb-5 pt-2 px-2">
        <h1 className="text-base font-semibold tracking-tight">My Dashboard</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Personal productivity</p>
      </div>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === href
              ? "bg-neutral-900 text-white font-medium"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
