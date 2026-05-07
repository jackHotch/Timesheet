import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { User } from '../auth/user.decorator';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  getInvoices(@User() userId: number, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.getInvoices(userId, query);
  }

  @Patch('/:id')
  updateInvoices(@User() userId: number, @Param('id') invoiceId: string, @Body() body: UpdateInvoiceDto) {
    return this.invoicesService.updateInvoice(userId, invoiceId, body)
  }
}
