import { Controller, Get, Param } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { DOMAIN_ADAPTER_MAP, DomainId, getDomainAdapters } from '@gigvora/integrations/domain-adapter-map';

@Controller('integrations')
class IntegrationsController {
  @Get('adapter-map') all() { return DOMAIN_ADAPTER_MAP; }
  @Get('adapter-map/:domain') one(@Param('domain') domain: string) {
    return getDomainAdapters(domain as DomainId);
  }
}

@Module({ controllers: [IntegrationsController] })
export class IntegrationsModule {}
