'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Clock, File, FileText, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/timesheet', label: 'Timesheet', icon: Clock },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/files', label: 'Files', icon: File },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  function handleLogout() {
    localStorage.removeItem('access_token')
    router.push('/')
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-60 flex-col border-r border-sidebar-border bg-background">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Clock className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-heading text-sm leading-tight font-bold text-sidebar-foreground">Timesheet</p>
          <p className="text-xs text-muted-foreground">Personal · {new Date().getFullYear()}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Workspace</p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="relative border-t border-sidebar-border px-3 py-4" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="text-[10px] font-bold text-primary">JH</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm leading-tight font-medium text-sidebar-foreground">Jack Hotchkiss</p>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-3 bottom-full left-3 z-50 mb-1 rounded-lg border border-border bg-popover py-1 shadow-md">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
