import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ConfigurationService {
  constructor(private db: DatabaseService) {}

  async getHourlyRate() {
    const result = await this.db.query(
      `SELECT item_value
      FROM configuration
      WHERE item = 'hourly_rate'
      `,
    );

    return { hourly_rate: Number(result.rows[0].item_value) };
  }
}
