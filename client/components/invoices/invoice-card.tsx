import { Invoice, InvoiceStatus } from "@/lib/types"
import { StatusDropdown } from "../ui/status-dropdown"
import { useUpdateInvoiceStatus } from '@/hooks/use-invoice'

interface InvoiceCardProps {
  invoice: Invoice
}

export const InvoiceCard = ({ invoice }: InvoiceCardProps) => {
  const updateStatus = useUpdateInvoiceStatus({
    year: invoice.year,
    month: invoice.month,
    half: invoice.period,
  })


  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span>{invoice.month}</span>
        <StatusDropdown 
          value={invoice.status} 
          onChange={(status) => updateStatus.mutate({ id: invoice.invoice_id, status: status as InvoiceStatus })} 
        />
      </div>
    </div>
  )
}