export function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-description">{sub}</p>
    </div>
  )
}
