import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsUUID()
  matchedItemId?: string;
}

export class UpdateNotificationDto {
  @IsBoolean()
  isRead: boolean;
}

export class NotificationResponseDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  matchedItemId?: string;
  isRead: boolean;
  createdAt: Date;
}

export class PaginatedNotificationsDto {
  data: NotificationResponseDto[];
  total: number;
  skip: number;
  take: number;
}
