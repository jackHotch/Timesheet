import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      `SELECT first_name, last_name, email FROM users`,
    );
    this.logger.debug(`Fetched ${result.rows.length} users`);
    return result.rows;
  }

  async findByEmail(email: string) {
    const result = await this.db.query<{
      id: string;
      email: string;
      password_hash: string;
    }>(`SELECT id, email, password_hash FROM users WHERE email = $1`, [email]);
    return result.rows[0] ?? null;
  }
}
