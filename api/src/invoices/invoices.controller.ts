import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { User } from '../auth/user.decorator';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

const INVOICE_FILE_TYPES = ['invoice', 'summary'] as const;
type InvoiceFileType = (typeof INVOICE_FILE_TYPES)[number];

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  getInvoices(@User() userId: number, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.getInvoices(userId, query);
  }

  @Get(':id')
  getInvoiceById(@User() userId: number, @Param('id') invoiceId: string) {
    return this.invoicesService.getInvoiceById(userId, invoiceId);
  }

  @Patch('/:id')
  updateInvoices(@User() userId: number, @Param('id') invoiceId: string, @Body() body: UpdateInvoiceDto) {
    return this.invoicesService.updateInvoice(userId, invoiceId, body)
  }

  @Post('/:id/files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @User() userId: number,
    @Param('id') invoiceId: string,
    @Body('fileType') fileType: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'application/pdf' })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    if (!INVOICE_FILE_TYPES.includes(fileType as InvoiceFileType)) {
      throw new BadRequestException('Invalid fileType');
    }
    return this.invoicesService.uploadFile(userId, invoiceId, fileType as InvoiceFileType, file);
  }
}
