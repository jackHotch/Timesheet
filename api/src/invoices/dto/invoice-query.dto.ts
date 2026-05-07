import { IsIn, IsNumber, IsOptional } from 'class-validator'
import type { InvoiceStatus, InvoiceHalf } from '../../common/types';

export class InvoiceQueryDto {
  @IsOptional()
  @IsIn(['draft', 'sent', 'paid', 'overdue'] satisfies InvoiceStatus[])
  status?: InvoiceStatus;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  month?: number;

  @IsOptional()
  @IsIn(['first', 'second'] satisfies InvoiceHalf[])
  half?: InvoiceHalf;
}
