import { Module } from '@nestjs/common';
import { CustomerServiceController } from './customer-service.controller';
import { CustomerServiceService } from './customer-service.service';
import { CustomerServiceRepository } from './customer-service.repository';
import { CsTasksRepository } from './cs-tasks.repository';

@Module({
  controllers: [CustomerServiceController],
  providers: [CustomerServiceService, CustomerServiceRepository, CsTasksRepository],
  exports: [CustomerServiceService],
})
export class CustomerServiceModule {}
