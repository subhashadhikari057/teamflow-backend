import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StarterService } from './starter.service';

@ApiTags('Admin Starter')
@Controller('admin/hello')
export class StarterAdminController {
  constructor(private readonly starterService: StarterService) {}

  @Get()
  @ApiOperation({ summary: 'Test admin starter endpoint' })
  getHello() {
    return this.starterService.getAdminHello();
  }
}
