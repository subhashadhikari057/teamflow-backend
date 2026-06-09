import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StarterService } from './starter.service';

@ApiTags('Mobile Starter')
@Controller('mobile/hello')
export class StarterMobileController {
  constructor(private readonly starterService: StarterService) {}

  @Get()
  @ApiOperation({ summary: 'Test mobile starter endpoint' })
  getHello() {
    return this.starterService.getMobileHello();
  }
}
