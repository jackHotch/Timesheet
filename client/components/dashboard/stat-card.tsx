import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  amount: string
  sub: ReactNode
}

export function StatCard({ label, amount, sub }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-2 min-w-0">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="text-3xl font-bold text-foreground">{amount}</p>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">{sub}</div>
    </div>
  )
}
