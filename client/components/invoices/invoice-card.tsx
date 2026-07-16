import { Half, Invoice, InvoiceStatus } from "@/lib/types"
import { StatusDropdown } from "../ui/status-dropdown"
import { useUpdateInvoiceStatus } from '@/hooks/use-invoice'
import { fetchFileUrl } from '@/hooks/use-files'
import { formatCurrency } from "@/lib/utils"
import { PROJECT_COLORS } from "@/lib/constants"
import { FileSpreadsheet, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface InvoiceCardProps {
  invoice: Invoice
}

export const InvoiceCard = ({ invoice }: InvoiceCardProps) => {
  const router = useRouter()
  const updateStatus = useUpdateInvoiceStatus({
    year: invoice.year,
    month: invoice.month,
    half: invoice.period,
  })

  function getPeriodDisplayValue(month: number, half: Half): string {
    const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'short' })
    const lastDay = new Date(invoice.year, month, 0).getDate()
    return `${monthName} ${half === Half.FIRST_HALF ? '1-14' : `15-${lastDay}`}, ${invoice.year}`
  }

  function handleClick() {
    router.push(`/timesheet?id=${invoice.invoice_id}`)
  }

  async function handleFileClick(fileId: string) {
    const url = await fetchFileUrl(fileId, false)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const invoiceFile = invoice.files.find(f => f.fileType === 'invoice')

  return (
    <div onClick={handleClick} className="card flex flex-col gap-2 cursor-pointer hover:border-ring/50 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{getPeriodDisplayValue(invoice.month, invoice.period)}</span>
        <div onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            value={invoice.status}
            onChange={(status) => updateStatus.mutate({ id: invoice.invoice_id, status: status as InvoiceStatus })}
          />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold">
          {formatCurrency(Number(invoice.total_amount))}
        </p>

        <span className="text-sm">{invoice.total_hours} hours · {invoice.projects.length} projects</span>
      </div>

      <hr />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {invoice.projects.map((project, key) => {
            const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
            return (
              <span key={key} className="w-3 h-3 rounded-xs" style={{ backgroundColor: color.dot }} />
            )
          })}
        </div>

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {invoiceFile && (
            <span title="Invoice" onClick={() => handleFileClick(invoiceFile.id)}>
              <FileText size={28} className="p-1.5 hover:bg-ring/30 rounded-sm cursor-pointer" />
            </span>
          )}
          {invoice.files.some(f => f.fileType === 'summary') && <span title="Summary"><FileSpreadsheet size={28} className="p-1.5 hover:bg-ring/30 rounded-sm" /></span>}
        </div>
      </div>
    </div>
  )
}