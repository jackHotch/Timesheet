'use client'

import { usePathname } from 'next/navigation'

export const Header = () => {
  const pathname = usePathname()

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))

  const crumbs = ['Workspace', ...segments]

  return (
    <div className="flex items-center gap-1.5 border border-l-0 border-sidebar-border bg-background p-4 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground">·</span>}
          <span className={i < crumbs.length - 1 ? 'text-muted-foreground' : 'text-foreground'}>{crumb}</span>
        </span>
      ))}
    </div>
  )
}
