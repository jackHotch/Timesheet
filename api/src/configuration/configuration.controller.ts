import { Controller, Get } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';

@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('/hourly-rate')
  getHourlyRate() {
    return this.configurationService.getHourlyRate();
  }
}
