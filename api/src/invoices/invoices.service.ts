import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {

  constructor(private db: DatabaseService) {}

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
}
