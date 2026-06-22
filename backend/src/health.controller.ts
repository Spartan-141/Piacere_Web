import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check del servidor' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Piacere API',
      version: '2.0.0',
    };
  }
}
