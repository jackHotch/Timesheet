import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DatabaseModule } from '../database/database.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [DatabaseModule, AwsModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
