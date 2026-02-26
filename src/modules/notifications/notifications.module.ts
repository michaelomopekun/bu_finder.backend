import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NOTIFICATIONS_REPOSITORY, NOTIFICATIONS_SERVICE } from './interface';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useClass: NotificationsRepository,
    },
    {
      provide: NOTIFICATIONS_SERVICE,
      useClass: NotificationsService,
    },
  ],
  exports: [NOTIFICATIONS_SERVICE],
})
export class NotificationsModule {}
