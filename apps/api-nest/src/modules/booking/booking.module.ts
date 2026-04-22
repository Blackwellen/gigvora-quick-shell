import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { BookingAnalyticsService } from './booking.analytics.service';
import { BookingMlService } from './booking.ml.service';
import { CalendarModule } from '../calendar/calendar.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CalendarModule, WorkspaceModule, NotificationsModule],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository, BookingAnalyticsService, BookingMlService],
  exports: [BookingService],
})
export class BookingModule {}
