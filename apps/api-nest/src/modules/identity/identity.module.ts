import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { IdentityRepository } from './identity.repository';
import { RiskService } from './risk.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [IdentityController],
  providers: [IdentityService, IdentityRepository, RiskService, JwtStrategy],
  exports: [IdentityService],
})
export class IdentityModule {}
