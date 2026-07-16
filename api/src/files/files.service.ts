import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { S3Service } from '../aws/s3.service';
import { FilesQueryDto } from './dto/files-query.dto';

@Injectable()
export class FilesService {
  constructor(
    private db: DatabaseService,
    private s3: S3Service,
  ) {}

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

  async getFileUrl(userId: number, fileId: string, download: boolean) {
    const result = await this.db.query<{ s3_key: string; file_name: string }>(
      `SELECT inf.s3_key, inf.file_name
      FROM invoice_files inf
      JOIN invoices inv ON inv.id = inf.invoice_id
      WHERE inf.id = $1 AND inv.user_id = $2`,
      [fileId, userId],
    );

    const file = result.rows[0];
    if (!file) throw new NotFoundException('File not found');

    const disposition = `${download ? 'attachment' : 'inline'}; filename="${file.file_name}"`;
    const url = await this.s3.getSignedDownloadUrl(file.s3_key, disposition);

    return { url };
  }

  async deleteFile(userId: number, fileId: string) {
    const result = await this.db.query<{ s3_key: string }>(
      `DELETE FROM invoice_files inf
      USING invoices inv
      WHERE inf.id = $1 AND inf.invoice_id = inv.id AND inv.user_id = $2
      RETURNING inf.s3_key`,
      [fileId, userId],
    );

    const file = result.rows[0];
    if (!file) throw new NotFoundException('File not found');

    await this.s3.deleteFile(file.s3_key);
  }
}
