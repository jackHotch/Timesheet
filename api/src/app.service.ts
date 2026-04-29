import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private db: DatabaseService) {}

  getHello(): string {
    return 'Hello jaaaaaaaa!';
  }

  getTest() {
    return this.db.query(`
      select * from test`);
  }
}
