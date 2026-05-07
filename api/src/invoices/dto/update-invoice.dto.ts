import { IsOptional, IsIn } from "class-validator";
import type { InvoiceStatus } from "../../common/types";

export class UpdateInvoiceDto {
  @IsOptional()
  @IsIn(['draft', 'sent', 'paid', 'overdue'] satisfies InvoiceStatus[])
  status?: InvoiceStatus;
}