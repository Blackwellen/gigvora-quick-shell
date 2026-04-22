import { Module } from '@nestjs/common';
import { OrgMembersSeatsController } from './org-members-seats.controller';
import { OrgMembersSeatsService } from './org-members-seats.service';
import { OrgMembersSeatsRepository } from './org-members-seats.repository';

@Module({
  controllers: [OrgMembersSeatsController],
  providers: [OrgMembersSeatsService, OrgMembersSeatsRepository],
  exports: [OrgMembersSeatsService],
})
export class OrgMembersSeatsModule {}
