import { Module } from '@nestjs/common';
import { MlPipelineController } from './ml-pipeline.controller';
import { MlPipelineService } from './ml-pipeline.service';
import { MlPipelineRepository } from './ml-pipeline.repository';

@Module({
  controllers: [MlPipelineController],
  providers: [MlPipelineService, MlPipelineRepository],
  exports: [MlPipelineService],
})
export class MlPipelineModule {}
