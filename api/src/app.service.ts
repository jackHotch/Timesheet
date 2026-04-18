import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private db: DatabaseService) {}

  getHello(): string {
    return 'Hello jaaaaaaaa!';
  }

  getTest() {
    return this.db.query(`
      select * from test`);
  }
}
