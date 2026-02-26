import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { INotificationsService } from './interface';
import { NOTIFICATIONS_REPOSITORY } from './interface';
import type { INotificationsRepository, NotificationData } from './interface/notifications-repository.interface';
import { NotificationResponseDto, PaginatedNotificationsDto } from './dto';

@Injectable()
export class NotificationsService implements INotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    matchedItemId?: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.create({
      userId,
      title,
      message,
      matchedItemId,
    });

    return this.mapToResponseDto(notification);
  }

  async getUserNotifications(
    userId: string,
    skip: number = 0,
    take: number = 20,
  ): Promise<PaginatedNotificationsDto> {
    const notifications = await this.notificationsRepository.findByUserId(userId, skip, take);
    const total = await this.notificationsRepository.countByUserId(userId);

    return {
      data: notifications.map((n) => this.mapToResponseDto(n)),
      total,
      skip,
      take,
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('This notification does not belong to you');
    }

    const updatedNotification = await this.notificationsRepository.markAsRead(notificationId);

    return this.mapToResponseDto(updatedNotification);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    await this.notificationsRepository.delete(notificationId);
  }

  private mapToResponseDto(notification: NotificationData): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      matchedItemId: notification.matchedItemId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
