import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TimesheetService {
  private readonly logger = new Logger(TimesheetService.name);

  constructor(private db: DatabaseService) {}

  async getProjects(userId: number) {
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

  async createProject(userId: number, name: string, colorIndex: number) {
    const result = await this.db.query(
      `INSERT INTO user_projects (user_id, name, color_index)
       VALUES ($1, $2, $3)
       RETURNING id, name, color_index AS "colorIndex"`,
      [userId, name, colorIndex],
    );
    this.logger.debug(`Created project "${name}" for user ${userId}`);
    return result.rows[0];
  }

  async deleteProject(userId: number, projectId: string) {
    await this.db.query(
      `DELETE FROM user_projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );
    this.logger.debug(`Deleted project ${projectId} for user ${userId}`);
  }

  async getEntries(userId: number, year: number, month: number, half: 'first' | 'second') {
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

  async upsertEntry(userId: number, projectId: string, date: string, hours: number) {
    const [year, month, day] = date.split('-').map(Number);
    const period = day < 15 ? 'FIRST_HALF' : 'SECOND_HALF';
    const startDay = period === 'FIRST_HALF' ? 1 : 15;
    const endDay = period === 'FIRST_HALF' ? 14 : new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, '0');
    const periodStart = `${year}-${mm}-${String(startDay).padStart(2, '0')}`;
    const periodEnd = `${year}-${mm}-${String(endDay).padStart(2, '0')}`;

    if (hours <= 0) {
      await this.db.query(
        `DELETE FROM timesheet_entries
         WHERE user_id = $1 AND project_id = $2 AND date = $3`,
        [userId, projectId, date],
      );
      this.logger.debug(`Deleted entry user=${userId} project=${projectId} date=${date}`);

      const remaining = await this.db.query(
        `SELECT COUNT(*) AS count FROM timesheet_entries
         WHERE user_id = $1 AND date >= $2 AND date <= $3`,
        [userId, periodStart, periodEnd],
      );
      if (parseInt(remaining.rows[0].count, 10) === 0) {
        await this.db.query(
          `DELETE FROM invoices WHERE user_id = $1 AND year = $2 AND month = $3 AND period = $4`,
          [userId, year, month, period],
        );
        this.logger.debug(`Deleted invoice for user=${userId} ${year}/${month} ${period}`);
      }
    } else {
      await this.db.query(
        `INSERT INTO timesheet_entries (user_id, project_id, date, hours)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, project_id, date) DO UPDATE SET hours = EXCLUDED.hours`,
        [userId, projectId, date, hours],
      );
      this.logger.debug(`Upserted entry user=${userId} project=${projectId} date=${date} hours=${hours}`);

      await this.db.query(
        `INSERT INTO invoices (user_id, year, month, period)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, year, month, period) DO NOTHING`,
        [userId, year, month, period],
      );
      this.logger.debug(`Ensured invoice for user=${userId} ${year}/${month} ${period}`);
    }
  }
}
