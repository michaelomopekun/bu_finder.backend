import { Controller, Get, Patch, Param, UseGuards, Query, BadRequestException, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { INotificationsService } from './interface';
import { NOTIFICATIONS_SERVICE } from './interface';
import { PaginatedNotificationsDto, NotificationResponseDto } from './dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: INotificationsService,
  ) {}

  @Get()
  async getUserNotifications(
    @CurrentUser('id') userId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
  ): Promise<PaginatedNotificationsDto> {
    const skipNum = parseInt(skip, 10);
    const takeNum = parseInt(take, 10);

    if (isNaN(skipNum) || skipNum < 0) {
      throw new BadRequestException('Skip must be a non-negative number');
    }

    if (isNaN(takeNum) || takeNum < 1 || takeNum > 100) {
      throw new BadRequestException('Take must be between 1 and 100');
    }

    return this.notificationsService.getUserNotifications(userId, skipNum, takeNum);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(notificationId, userId);
  }
}
