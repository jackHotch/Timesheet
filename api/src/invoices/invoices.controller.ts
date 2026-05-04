import { Controller, Get } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { User } from '../auth/user.decorator';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  getInvoices(@User() userId: number) {
    return this.invoicesService.getInvoices(userId)
  }
}
