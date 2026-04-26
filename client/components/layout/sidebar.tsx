"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Clock, FileText, LogOut, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/timesheet", label: "Timesheet", icon: Clock },
  { href: "/invoices", label: "Invoices", icon: FileText },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    localStorage.removeItem("access_token")
    router.push("/")
  }

  return (
    <aside className="flex flex-col w-60 h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm text-sidebar-foreground leading-tight">Timelog</p>
          <p className="text-xs text-muted-foreground">Weekly hours tracker</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary">JH</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">Jack Hotchkiss</p>
            <p className="text-xs text-muted-foreground truncate">$50 / hr</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  )
}
