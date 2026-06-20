import { IsEnum, IsNumber, IsOptional } from 'class-validator'

export class FilesQueryDto {
  @IsOptional()
  @IsNumber()
  year?: number

  @IsOptional()
  @IsEnum(['invoice', 'summary'])
  fileType?: 'invoice' | 'summary'

  @IsOptional()
  @IsEnum(['draft', 'sent', 'paid', 'overdue'])
  status?: string
}
