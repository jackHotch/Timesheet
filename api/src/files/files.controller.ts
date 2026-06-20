import { Controller, Get, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { User } from '../auth/user.decorator';
import { FilesQueryDto } from './dto/files-query.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  getFiles(@User() userId: number, @Query() query: FilesQueryDto) {
    return this.filesService.getFiles(userId, query);
  }

  @Get('stats')
  getFileStats(@User() userId: number) {
    return this.filesService.getFileStats(userId);
  }
}
