import { Controller, Get, Module } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get() check() { return { status: 'ok', ts: Date.now() }; }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
