import { Module } from '@nestjs/common';
import { ExperienceLaunchpadController } from './experience-launchpad.controller';
import { ExperienceLaunchpadService } from './experience-launchpad.service';
import { ExperienceLaunchpadRepository } from './experience-launchpad.repository';

@Module({
  controllers: [ExperienceLaunchpadController],
  providers: [ExperienceLaunchpadService, ExperienceLaunchpadRepository],
  exports: [ExperienceLaunchpadService],
})
export class ExperienceLaunchpadModule {}
