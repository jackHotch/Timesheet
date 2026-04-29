import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TimesheetService {
  private readonly logger = new Logger(TimesheetService.name);

  constructor(private db: DatabaseService) {}

  async getProjects(userId: string) {
    const result = await this.db.query(
      `SELECT id, name, color_index AS "colorIndex"
       FROM user_projects
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId],
    );
    this.logger.debug(`Fetched ${result.rows.length} projects for user ${userId}`);
    return result.rows;
  }

  async createProject(userId: string, name: string, colorIndex: number) {
    const result = await this.db.query(
      `INSERT INTO user_projects (user_id, name, color_index)
       VALUES ($1, $2, $3)
       RETURNING id, name, color_index AS "colorIndex"`,
      [userId, name, colorIndex],
    );
    this.logger.debug(`Created project "${name}" for user ${userId}`);
    return result.rows[0];
  }

  async deleteProject(userId: string, projectId: string) {
    await this.db.query(
      `DELETE FROM user_projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    this.logger.debug(`Deleted project ${projectId} for user ${userId}`);
  }

  async getEntries(userId: string, year: number, month: number, half: 'first' | 'second') {
    const startDay = half === 'first' ? 1 : 15;
    const endDay = half === 'first' ? 14 : new Date(year, month + 1, 0).getDate();
    const startDate = new Date(year, month, startDay).toISOString().split('T')[0];
    const endDate = new Date(year, month, endDay).toISOString().split('T')[0];

    const result = await this.db.query(
      `SELECT project_id AS "projectId",
              TO_CHAR(date, 'YYYY-MM-DD') AS date,
              CAST(hours AS FLOAT) AS hours
       FROM timesheet_entries
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate],
    );
    this.logger.debug(`Fetched ${result.rows.length} entries for user ${userId} period ${startDate}–${endDate}`);
    return result.rows;
  }

  async upsertEntry(userId: string, projectId: string, date: string, hours: number) {
    if (hours <= 0) {
      await this.db.query(
        `DELETE FROM timesheet_entries
         WHERE user_id = $1 AND project_id = $2 AND date = $3`,
        [userId, projectId, date],
      );
      this.logger.debug(`Deleted entry user=${userId} project=${projectId} date=${date}`);
    } else {
      await this.db.query(
        `INSERT INTO timesheet_entries (user_id, project_id, date, hours)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, project_id, date) DO UPDATE SET hours = EXCLUDED.hours`,
        [userId, projectId, date, hours],
      );
      this.logger.debug(`Upserted entry user=${userId} project=${projectId} date=${date} hours=${hours}`);
    }
  }
}
