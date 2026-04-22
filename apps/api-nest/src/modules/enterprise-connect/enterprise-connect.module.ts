import { Module } from '@nestjs/common';
import { EnterpriseConnectController } from './enterprise-connect.controller';
import { EnterpriseConnectService } from './enterprise-connect.service';
import { EnterpriseConnectRepository } from './enterprise-connect.repository';

@Module({
  controllers: [EnterpriseConnectController],
  providers: [EnterpriseConnectService, EnterpriseConnectRepository],
  exports: [EnterpriseConnectService],
})
export class EnterpriseConnectModule {}
