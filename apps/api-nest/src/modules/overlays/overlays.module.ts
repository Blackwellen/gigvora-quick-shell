import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OverlaysController } from './overlays.controller';
import { OverlaysService } from './overlays.service';
import { OverlaysRepository } from './overlays.repository';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [OverlaysController],
  providers: [OverlaysService, OverlaysRepository, JwtStrategy],
  exports: [OverlaysService],
})
export class OverlaysModule {}
