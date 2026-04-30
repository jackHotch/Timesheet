import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { User } from '../auth/user.decorator';

@Controller('timesheet')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Get('projects')
  getProjects(@User() userId: number) {
    return this.timesheetService.getProjects(userId);
  }

  @Post('projects')
  createProject(
    @User() userId: number,
    @Body() body: { name: string; colorIndex: number },
  ) {
    return this.timesheetService.createProject(userId, body.name, body.colorIndex);
  }

  @Delete('projects/:id')
  deleteProject(@User() userId: number, @Param('id') projectId: string) {
    return this.timesheetService.deleteProject(userId, projectId);
  }

  @Get('entries')
  getEntries(
    @User() userId: number,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('half') half: 'first' | 'second',
  ) {
    return this.timesheetService.getEntries(userId, Number(year), Number(month), half);
  }

  @Put('entries')
  upsertEntry(
    @User() userId: number,
    @Body() body: { projectId: string; date: string; hours: number },
  ) {
    return this.timesheetService.upsertEntry(userId, body.projectId, body.date, body.hours);
  }
}
