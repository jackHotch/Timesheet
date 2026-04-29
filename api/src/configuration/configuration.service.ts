import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(private db: DatabaseService) {}

  async getHourlyRate() {
    const result = await this.db.query(
      `SELECT item_value
      FROM configuration
      WHERE item = 'hourly_rate'
      `,
    );

    const hourlyRate = Number(result.rows[0].item_value);
    this.logger.debug(`Fetched hourly rate: ${hourlyRate}`);
    return { hourly_rate: hourlyRate };
  }
}
