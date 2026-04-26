"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Clock, File, FileText, LayoutDashboard, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
  { href: "/timesheet", label: "Timesheet", icon: Clock },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: '/files', label: 'Files', icon: File }
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  function handleLogout() {
    localStorage.removeItem("access_token")
    router.push("/")
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <aside className="flex flex-col w-60 h-screen bg-background border-r border-sidebar-border fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm text-sidebar-foreground leading-tight">Timesheet</p>
          <p className="text-xs text-muted-foreground">Personal · {new Date().getFullYear()}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Workspace
        </p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(prev => !prev)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary">JH</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">Jack Hotchkiss</p>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border border-border rounded-lg shadow-md py-1 z-50">
            <button
              onClick={handleLogout}
              className="text-red-400 flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
