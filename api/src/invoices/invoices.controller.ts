import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { User } from '../auth/user.decorator';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  getInvoices(@User() userId: number, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.getInvoices(userId, query);
  }

  // @Get('period')
  // getInvoiceForPeriod(
  //   @User() userId: number,
  //   @Query('year') year: string,
  //   @Query('month') month: string,
  //   @Query('half') half: 'first' | 'second',
  // ) {
  //   return this.invoicesService.getInvoiceForPeriod(userId, +year, +month, half);
  // }

  // @Patch(':id/status')
  // updateInvoiceStatus(
  //   @User() userId: number,
  //   @Param('id') id: string,
  //   @Body('status') status: string,
  // ) {
  //   return this.invoicesService.updateInvoiceStatus(userId, id, status as any);
  // }
}
