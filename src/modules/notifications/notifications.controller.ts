import { Controller, Get, Patch, Param, UseGuards, Query, BadRequestException, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { INotificationsService } from './interface';
import { NOTIFICATIONS_SERVICE } from './interface';
import { PaginatedNotificationsDto, NotificationResponseDto } from './dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Notifications')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: INotificationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description:
      'Retrieve all notifications for the authenticated user with pagination support. Results are sorted by creation date (newest first).',
  })
  @ApiQuery({
    name: 'skip',
    type: Number,
    required: false,
    description: 'Number of notifications to skip (default: 0)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    type: Number,
    required: false,
    description: 'Number of notifications to return (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notifications',
    type: PaginatedNotificationsDto,
    example: {
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Potential Match Found!',
          message: 'Someone found an item similar to your "iPhone 14 Pro". Match confidence: 85%',
          matchedItemId: '550e8400-e29b-41d4-a716-446655440002',
          isRead: false,
          createdAt: '2026-02-26T10:30:00Z',
        },
      ],
      total: 5,
      skip: 0,
      take: 20,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Take must be between 1 and 100',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read for the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The notification ID to mark as read',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully marked notification as read',
    type: NotificationResponseDto,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Potential Match Found!',
      message: 'Someone found an item similar to your "iPhone 14 Pro". Match confidence: 85%',
      matchedItemId: '550e8400-e29b-41d4-a716-446655440002',
      isRead: true,
      createdAt: '2026-02-26T10:30:00Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Notification not found or does not belong to the user',
    schema: {
      example: {
        statusCode: 404,
        message: 'Notification with ID 550e8400-e29b-41d4-a716-446655440000 not found',
      },
    },
  })
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(notificationId, userId);
  }
}
