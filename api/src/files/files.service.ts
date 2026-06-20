import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FilesQueryDto } from './dto/files-query.dto';

@Injectable()
export class FilesService {
  constructor(private db: DatabaseService) {}

  async getFiles(userId: number, query?: FilesQueryDto) {
    const conditions: string[] = [];
    const params: (number | string)[] = [userId];

    if (query?.year !== undefined) {
      params.push(query.year);
      conditions.push(`inv.year = $${params.length}`);
    }

    if (query?.fileType !== undefined) {
      params.push(query.fileType);
      conditions.push(`inf.file_type = $${params.length}`);
    }

    if (query?.status !== undefined) {
      params.push(query.status);
      conditions.push(`inv.status = $${params.length}`);
    }

    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(
      `SELECT
        inf.id,
        inf.file_name,
        inf.file_type,
        inf.s3_key,
        inf.created_at,
        inv.id AS invoice_id,
        inv.year,
        inv.month,
        inv.period,
        inv.status
      FROM invoice_files inf
      JOIN invoices inv ON inv.id = inf.invoice_id
      WHERE inv.user_id = $1 ${where}
      ORDER BY inf.created_at DESC`,
      params,
    );

    return result.rows;
  }

  async getFileStats(userId: number) {
    const result = await this.db.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE inf.file_type = 'invoice') AS invoice_count,
        COUNT(*) FILTER (WHERE inf.file_type = 'summary') AS summary_count
      FROM invoice_files inf
      JOIN invoices inv ON inv.id = inf.invoice_id
      WHERE inv.user_id = $1`,
      [userId],
    );

    return result.rows[0];
  }
}
