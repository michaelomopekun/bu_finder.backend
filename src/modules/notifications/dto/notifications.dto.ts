import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'The user ID who will receive the notification',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Potential Match Found!',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'Someone found an item similar to your "iPhone 14 Pro". Match confidence: 85%',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'The matched item ID (optional)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  matchedItemId?: string;
}

export class UpdateNotificationDto {
  @ApiProperty({
    description: 'Whether the notification has been read',
    example: true,
  })
  @IsBoolean()
  isRead: boolean;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: 'The notification ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The user ID who owns this notification',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Potential Match Found!',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'Someone found an item similar to your "iPhone 14 Pro". Match confidence: 85%',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'The matched item ID (if applicable)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  matchedItemId?: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'When the notification was created',
    example: '2026-02-26T10:30:00Z',
  })
  createdAt: Date;
}

export class PaginatedNotificationsDto {
  @ApiProperty({
    description: 'Array of notification objects',
    isArray: true,
    type: NotificationResponseDto,
  })
  data: NotificationResponseDto[];

  @ApiProperty({
    description: 'Total count of notifications for the user',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Number of notifications skipped (offset)',
    example: 0,
  })
  skip: number;

  @ApiProperty({
    description: 'Number of notifications returned',
    example: 20,
  })
  take: number;
}
