import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      `SELECT first_name, last_name, email FROM users`,
    );
    return result.rows;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }
}
