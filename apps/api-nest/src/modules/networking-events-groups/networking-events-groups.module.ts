import { Module } from '@nestjs/common';
import { NetworkingEventsGroupsController } from './networking-events-groups.controller';
import { NetworkingEventsGroupsService } from './networking-events-groups.service';
import { NetworkingEventsGroupsRepository } from './networking-events-groups.repository';

@Module({
  controllers: [NetworkingEventsGroupsController],
  providers: [NetworkingEventsGroupsService, NetworkingEventsGroupsRepository],
  exports: [NetworkingEventsGroupsService],
})
export class NetworkingEventsGroupsModule {}
