import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ItemsModule } from '../item_report/items.module';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimsRepository } from './claims.repository';
import { CLAIMS_SERVICE } from './interface/claims-service.interface';
import { CLAIMS_REPOSITORY } from './interface/claims-repository.interface';

@Module({
  imports: [CloudinaryModule, NotificationsModule, ItemsModule],
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    { provide: CLAIMS_REPOSITORY, useClass: ClaimsRepository },
    { provide: CLAIMS_SERVICE, useClass: ClaimsService },
  ],
  exports: [CLAIMS_SERVICE],
})
export class ClaimsModule {}
