import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsMlService } from './notifications.ml.service';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationsGateway, NotificationsMlService, JwtStrategy],
  exports: [NotificationsService, NotificationsGateway, NotificationsMlService],
})
export class NotificationsModule {}
