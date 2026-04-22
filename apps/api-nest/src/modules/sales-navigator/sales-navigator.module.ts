import { Module } from '@nestjs/common';
import { SalesNavigatorController } from './sales-navigator.controller';
import { SalesNavigatorService } from './sales-navigator.service';
import { SalesNavigatorRepository } from './sales-navigator.repository';

@Module({
  controllers: [SalesNavigatorController],
  providers: [SalesNavigatorService, SalesNavigatorRepository],
  exports: [SalesNavigatorService],
})
export class SalesNavigatorModule {}
