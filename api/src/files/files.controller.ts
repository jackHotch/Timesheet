import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
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

  @Get(':id/url')
  getFileUrl(
    @User() userId: number,
    @Param('id') id: string,
    @Query('download') download?: string,
  ) {
    return this.filesService.getFileUrl(userId, id, download === 'true');
  }

  @Delete(':id')
  deleteFile(@User() userId: number, @Param('id') id: string) {
    return this.filesService.deleteFile(userId, id);
  }
}
