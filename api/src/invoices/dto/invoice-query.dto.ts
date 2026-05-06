import { IsIn, IsNumber, IsOptional } from 'class-validator'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type InvoiceHalf = 'first' | 'second';

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
