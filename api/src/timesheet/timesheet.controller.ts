import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TimesheetService } from './timesheet.service';

@Controller('timesheet')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Get('projects')
  getProjects(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.timesheetService.getProjects(userId);
  }

  @Post('projects')
  createProject(
    @Req() req: Request,
    @Body() body: { name: string; colorIndex: number },
  ) {
    const userId = (req as any).user.sub;
    return this.timesheetService.createProject(userId, body.name, body.colorIndex);
  }

  @Delete('projects/:id')
  deleteProject(@Req() req: Request, @Param('id') projectId: string) {
    const userId = (req as any).user.sub;
    return this.timesheetService.deleteProject(userId, projectId);
  }

  @Get('entries')
  getEntries(
    @Req() req: Request,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('half') half: 'first' | 'second',
  ) {
    const userId = (req as any).user.sub;
    return this.timesheetService.getEntries(userId, Number(year), Number(month), half);
  }

  @Put('entries')
  upsertEntry(
    @Req() req: Request,
    @Body() body: { projectId: string; date: string; hours: number },
  ) {
    const userId = (req as any).user.sub;
    return this.timesheetService.upsertEntry(userId, body.projectId, body.date, body.hours);
  }
}
