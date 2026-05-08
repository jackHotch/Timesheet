import { formatCurrency } from "@/lib/utils"

interface TotalsCardProps {
  totalEarned: number
  totalHours: number
  totalPaid: number
  totalOutstanding: number
}

export const TotalsCard = ({ totalEarned, totalHours, totalPaid, totalOutstanding }: TotalsCardProps) => {
  return (
    <div className="flex flex-1 card flex-col gap-2">
          <p className="font-semibold">Totals</p>

          <div className="flex items-center justify-between">
            <span className="text-description">Earned</span>
            <span className="font-bold text-lg">{formatCurrency(totalEarned)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-description">Hours</span>
            <span>{totalHours}</span>
          </div>

          <hr />

          <div className="flex items-center justify-between">
            <span className="text-sm">Paid</span>
            <span className="text-sm">{formatCurrency(totalPaid)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Outstanding</span>
            <span className="text-sm">{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
  )
}
