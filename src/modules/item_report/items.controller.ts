import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { CreateItemDto, CreateItemResponseDto, GetItemCountResponseDto, GetItemsResponseDto, ItemResponseDto, RecentlyItemsQueryDto, GetRecentItemsResponseDto } from './dto/items.dto';
import { SearchItemsQueryDto, SearchItemsResponseDto } from './dto/search-items.dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators';
import { ITEMS_SERVICE, type IItemsService } from './interface/item-service.interface';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { responseStatus } from 'src/db/schema';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    @Inject(ITEMS_SERVICE)
    private readonly itemsService: IItemsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get pending item reports awaiting approval' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-100, default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Pagination offset (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Pending items retrieved successfully',
    type: GetRecentItemsResponseDto,
    example: {
      status: 'success',
      message: 'Pending item reports retrieved successfully',
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Lost iPhone 14 Pro',
          description: 'Blue iPhone with cracked screen, last seen at Library',
          category: 'Electronics',
          location: 'Library',
          type: 'LOST',
          status: 'PENDING',
          imageUrl: 'https://res.cloudinary.com/...',
          submittedBy: '550e8400-e29b-41d4-a716-446655440001',
          dateReported: '2026-02-28T08:15:00Z',
          createdAt: '2026-02-28T08:15:00Z',
          updatedAt: '2026-02-28T08:15:00Z',
        },
      ],
      pagination: {
        limit: 20,
        offset: 0,
        total: 5,
      },
    },
  })
  async getPendingItemReports(@Query() query: RecentlyItemsQueryDto): Promise<GetRecentItemsResponseDto> {
    const { items, total } = await this.itemsService.getPendingItems(query.limit, query.offset);

    return {
      status: responseStatus.SUCCESS,
      message: 'Pending item reports retrieved successfully',
      data: items,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
      },
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search items with weighted fuzzy matching' })
  @ApiResponse({ status: 200, description: 'Search completed successfully', type: SearchItemsResponseDto })
  async searchItems(@Query() query: SearchItemsQueryDto): Promise<SearchItemsResponseDto> {

    Logger.log(`Search query: ${JSON.stringify(query)}`, 'ItemsController.searchItems');

    const results = await this.itemsService.searchItems({
      query: query.q,
      type: query.type,
      location: query.location,
      category: query.category,
      limit: query.limit,
      offset: query.offset,
    });

    Logger.log(`Search results: ${JSON.stringify(results)}`, 'ItemsController.searchItems');

    return {
      status: responseStatus.SUCCESS,
      message: 'Search completed successfully',
      data: results,
      pagination: {
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

  @Get('recently-lost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recently approved lost items' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-100, default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Pagination offset (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Recently lost items retrieved successfully',
    type: GetRecentItemsResponseDto,
    example: {
      status: 'success',
      message: 'Recently lost items retrieved successfully',
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Lost iPhone 14 Pro',
          description: 'Blue iPhone with cracked screen',
          category: 'Electronics',
          location: 'Library',
          type: 'LOST',
          status: 'APPROVED',
          imageUrl: 'https://res.cloudinary.com/...',
          submittedBy: '550e8400-e29b-41d4-a716-446655440001',
          dateReported: '2026-02-26T10:30:00Z',
          createdAt: '2026-02-26T10:30:00Z',
          updatedAt: '2026-02-26T10:30:00Z',
        },
      ],
      pagination: {
        limit: 20,
        offset: 0,
        total: 42,
      },
    },
  })
  async getRecentlyLostItems(@Query() query: RecentlyItemsQueryDto): Promise<GetRecentItemsResponseDto> {
    const { items, total } = await this.itemsService.getRecentlyLostItems(query.limit, query.offset);

    return {
      status: responseStatus.SUCCESS,
      message: 'Recently lost items retrieved successfully',
      data: items,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
      },
    };
  }

  @Get('recently-found')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recently approved found items' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-100, default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Pagination offset (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Recently found items retrieved successfully',
    type: GetRecentItemsResponseDto,
    example: {
      status: 'success',
      message: 'Recently found items retrieved successfully',
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Found Blue iPhone',
          description: 'Found near the cafeteria',
          category: 'Electronics',
          location: 'Cafeteria',
          type: 'FOUND',
          status: 'APPROVED',
          imageUrl: 'https://res.cloudinary.com/...',
          submittedBy: '550e8400-e29b-41d4-a716-446655440003',
          dateReported: '2026-02-26T14:20:00Z',
          createdAt: '2026-02-26T14:20:00Z',
          updatedAt: '2026-02-26T14:20:00Z',
        },
      ],
      pagination: {
        limit: 20,
        offset: 0,
        total: 28,
      },
    },
  })
  async getRecentlyFoundItems(@Query() query: RecentlyItemsQueryDto): Promise<GetRecentItemsResponseDto> {
    const { items, total } = await this.itemsService.getRecentlyFoundItems(query.limit, query.offset);

    return {
      status: responseStatus.SUCCESS,
      message: 'Recently found items retrieved successfully',
      data: items,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a lost or found item with optional image' })
  @ApiResponse({ status: 201, description: 'Item reported successfully', type: CreateItemResponseDto })
  async createItem( @CurrentUser('id') userId: string, @Body() dto: CreateItemDto, @UploadedFile() file?: Express.Multer.File, ): Promise<CreateItemResponseDto> {
    let imageUrl: string | undefined;

    // Upload image to Cloudinary if provided
    if (file) {
      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException('Only image files are allowed (JPEG, PNG, WebP, GIF)');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('Image size must be less than 5MB');
      }

      try {
        const cloudinaryResponse = await this.cloudinaryService.uploadImage(file);
        imageUrl = cloudinaryResponse.secure_url;
      } catch (error) {
        throw new BadRequestException('Failed to upload image to Cloudinary');
      }
    }

    const item = await this.itemsService.createItem( {
      ...dto,
      imageUrl,
      submittedBy: userId,
    });

    return {
      status: responseStatus.SUCCESS,
      message: 'Item reported successfully',
      data: item,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully', type: GetItemsResponseDto })
  async getAllItems(): Promise<GetItemsResponseDto> {
    const items = await this.itemsService.getAllItems();
    return {
      status: responseStatus.SUCCESS,
      message: 'Items retrieved successfully',
      data: items,
    };
  }

  @Get('my-items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user items' })
  @ApiResponse({ status: 200, description: 'User items retrieved successfully', type: GetItemsResponseDto })
  async getUserItems(
    @CurrentUser('id') userId: string,
  ): Promise<GetItemsResponseDto> {
    const items = await this.itemsService.getUserItems(userId);
    return {
      status: responseStatus.SUCCESS,
      message: 'User items retrieved successfully',
      data: items,
    };
  }

  @Get('my-items/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user item count' })
  @ApiResponse({ status: 200, description: 'Item count retrieved successfully' })
  async getUserItemCount(
    @CurrentUser('id') userId: string,
  ): Promise<GetItemCountResponseDto> {
    const count = await this.itemsService.getUserItemCount(userId);
    return {
      status: responseStatus.SUCCESS,
      message: 'Item count retrieved successfully',
      data: count,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully', type: CreateItemResponseDto })
  async getItemById(
    @Param('id') id: string,
  ): Promise<CreateItemResponseDto> {
    const item = await this.itemsService.getItemById(id);
    return {
      status: responseStatus.SUCCESS,
      message: 'Item retrieved successfully',
      data: item,
    };
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Approve an item (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Item approved successfully', type: CreateItemResponseDto })
  async approveItem(
    @Param('id') id: string,
  ): Promise<CreateItemResponseDto> {
    const item = await this.itemsService.approveItem(id);
    return {
      status: responseStatus.SUCCESS,
      message: 'Item approved successfully',
      data: item,
    };
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Reject an item (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Item rejected successfully', type: CreateItemResponseDto })
  async rejectItem(
    @Param('id') id: string,
  ): Promise<CreateItemResponseDto> {
    const item = await this.itemsService.rejectItem(id);
    return {
      status: responseStatus.SUCCESS,
      message: 'Item rejected successfully',
      data: item,
    };
  }

  @Get('admin/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get dashboard metrics (total reports, pending approvals, resolved cases)' })
  @ApiResponse({ status: 200, description: 'Admin metrics retrieved successfully' })
  async getAdminMetrics(): Promise<any> {
    const metrics = await this.itemsService.getAdminMetrics();
    return {
      status: responseStatus.SUCCESS,
      message: 'Admin metrics retrieved successfully',
      data: metrics,
    };
  }
}