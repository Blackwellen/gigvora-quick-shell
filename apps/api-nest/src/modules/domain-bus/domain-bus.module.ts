import { Controller, Get } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { CROSS_DOMAIN_CATALOG } from './domain-bus';

@Controller('domain-bus')
class DomainBusController {
  @Get('catalog') catalog() { return { links: CROSS_DOMAIN_CATALOG }; }
}

@Module({ controllers: [DomainBusController] })
export class DomainBusModule {}
