import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ItemsRepository } from './Items.repository';
import { MatchingService } from './matching.service';
import { ITEMS_REPOSITORY, ITEMS_SERVICE } from './interface';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CloudinaryModule, NotificationsModule],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    MatchingService,
    {
      provide: ITEMS_REPOSITORY,
      useClass: ItemsRepository,
    },
    {
      provide: ITEMS_SERVICE,
      useClass: ItemsService,
    },
  ],
  exports: [ITEMS_SERVICE],
})
export class ItemsModule {}