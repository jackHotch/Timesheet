import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { S3Service } from '../aws/s3.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {

  constructor(
    private db: DatabaseService,
    private s3: S3Service,
  ) {}

  async getInvoices(userId: number, query?: InvoiceQueryDto) {
    const conditions: string[] = [];
    const params: (number | string)[] = [userId];

    if (query?.year !== undefined) {
      params.push(query.year);
      conditions.push(`ph.year = $${params.length}`);
    }

    if (query?.month !== undefined) {
      params.push(query.month);
      conditions.push(`ph.month = $${params.length}`);
    }

    if (query?.half !== undefined) {
      params.push(query.half);
      conditions.push(`ph.period = $${params.length}`);
    }

    if (query?.status !== undefined) {
      params.push(query.status);
      conditions.push(`inv.status = $${params.length}`);
    }

    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(
      `WITH project_hours AS (
        SELECT
          te.user_id,
          EXTRACT(YEAR FROM te.date)::int AS year,
          EXTRACT(MONTH FROM te.date)::int AS month,
          CASE WHEN EXTRACT(DAY FROM te.date) <= 14
            THEN 'FIRST_HALF' ELSE 'SECOND_HALF' END AS period,
          up.name AS project_name,
          up.color_index,
          SUM(te.hours) AS hours
        FROM timesheet_entries te
        JOIN user_projects up ON up.id = te.project_id
        WHERE te.user_id = $1
        GROUP BY te.user_id, year, month, period, up.name, up.color_index
      ),
      grouped AS (
        SELECT
          ph.year,
          ph.month AS month,
          ph.period,
          inv.id AS invoice_id,
          inv.status,
          SUM(ph.hours) AS total_hours,
          ROUND(SUM(ph.hours) * cfg.item_value::numeric, 2) AS total_amount,
          JSON_AGG(
            JSON_BUILD_OBJECT('name', ph.project_name, 'colorIndex', ph.color_index, 'hours', ph.hours)
            ORDER BY ph.hours DESC
          ) AS projects
        FROM project_hours ph
        JOIN invoices inv
          ON  inv.user_id      = ph.user_id
          AND inv.year         = ph.year
          AND inv.month        = ph.month
          AND inv.period::text = ph.period
        LEFT JOIN configuration cfg ON cfg.item = 'hourly_rate'
        WHERE ph.user_id = $1 ${where}
        GROUP BY ph.year, ph.month, ph.period, inv.id, inv.status, cfg.item_value
      )
      SELECT
        g.*,
        COALESCE(
          (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', inf.id, 'fileType', inf.file_type, 'fileName', inf.file_name, 's3Key', inf.s3_key))
           FROM invoice_files inf
           WHERE inf.invoice_id = g.invoice_id),
          '[]'
        ) AS files
      FROM grouped g
      ORDER BY g.year DESC, g.month DESC, g.period DESC`,
      params,
    );

    return result.rows;
  }

  async getInvoiceById(userId: number, invoiceId: string) {
    const result = await this.db.query(
      `SELECT year, month, period FROM invoices WHERE id = $1 AND user_id = $2`,
      [invoiceId, userId],
    );
    return result.rows[0] ?? null;
  }

  async updateInvoice(userId: number, invoiceId: string, body: UpdateInvoiceDto) {
    const columnMap: Record<keyof UpdateInvoiceDto, string> = {
      status: 'status',
    };

    const params: (number | string)[] = [invoiceId, userId];
    const setClauses: string[] = [];

    for (const [key, column] of Object.entries(columnMap) as [keyof UpdateInvoiceDto, string][]) {
      if (body[key] !== undefined) {
        params.push(body[key] as string);
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) return;

    const result = await this.db.query(
      `UPDATE invoices SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $1 
       AND user_id = $2
       RETURNING id, status`,
      params,
    );

    if (result.rows.length === 0) throw new NotFoundException('Invoice not found');
    return result.rows[0];
  }

  async uploadFile(
    userId: number,
    invoiceId: string,
    fileType: 'invoice' | 'summary',
    file: Express.Multer.File,
  ) {
    const invoice = await this.db.query(`SELECT id FROM invoices WHERE id = $1 AND user_id = $2`, [
      invoiceId,
      userId,
    ]);
    if (invoice.rows.length === 0) throw new NotFoundException('Invoice not found');

    const existing = await this.db.query<{ s3_key: string }>(
      `SELECT s3_key FROM invoice_files WHERE invoice_id = $1 AND file_type = $2`,
      [invoiceId, fileType],
    );

    const key = `invoices/${invoiceId}/${fileType}-${Date.now()}-${file.originalname}`;
    await this.s3.uploadFile(key, file.buffer, file.mimetype);

    const result = await this.db.query(
      `INSERT INTO invoice_files (invoice_id, file_type, s3_key, file_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (invoice_id, file_type)
       DO UPDATE SET s3_key = EXCLUDED.s3_key, file_name = EXCLUDED.file_name
       RETURNING id, file_type AS "fileType", file_name AS "fileName", s3_key AS "s3Key"`,
      [invoiceId, fileType, key, file.originalname],
    );

    const oldKey = existing.rows[0]?.s3_key;
    if (oldKey && oldKey !== key) {
      await this.s3.deleteFile(oldKey);
    }

    return result.rows[0];
  }
}
