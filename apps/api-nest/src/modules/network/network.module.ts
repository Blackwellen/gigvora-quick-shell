import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { NetworkRepository } from './network.repository';
import { NetworkMlService } from './network.ml.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
    WorkspaceModule,
  ],
  controllers: [NetworkController],
  providers: [NetworkService, NetworkRepository, NetworkMlService, JwtStrategy],
  exports: [NetworkService, NetworkMlService],
})
export class NetworkModule {}
