import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { itemStatuses, itemTypes } from 'src/db/schema';

export class CreateItemDto {
  @ApiProperty({ example: 'Lost iPhone 15', description: 'Item title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Black iPhone with cracked screen', description: 'Detailed description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Electronics', description: 'Item category' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Library', description: 'Location where item was lost/found' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'LOST', enum: itemTypes, description: 'Item type (LOST or FOUND)' })
  @IsEnum(itemTypes, { message: 'type must be LOST or FOUND' })
  type: itemTypes;

  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    required: false,
    description: 'Item image file (JPEG, PNG, WebP, GIF - max 5MB)' 
  })
  @IsOptional()
  image?: any; // File upload from multipart/form-data
}

export class RecentlyItemsQueryDto {
  @ApiProperty({
    example: 20,
    required: false,
    description: 'Number of items to return (1-100, default: 20)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @IsOptional()
  limit: number = 20;

  @ApiProperty({
    example: 0,
    required: false,
    description: 'Pagination offset (default: 0)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Offset cannot be negative' })
  @IsOptional()
  offset: number = 0;
}

export class ItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Lost iPhone 15' })
  title: string;

  @ApiProperty({ example: 'Black iPhone with cracked screen' })
  description: string;

  @ApiProperty({ example: 'Electronics' })
  category: string;

  @ApiProperty({ example: 'Library' })
  location: string;

  @ApiProperty({ example: 'LOST', enum: itemTypes })
  type: itemTypes;

  @ApiProperty({ example: 'PENDING', enum: itemStatuses })
  status: itemStatuses;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174111' })
  submittedBy: string;

  @ApiProperty()
  dateReported: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateItemResponseDto {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: string;

  @ApiProperty({ example: 'Item reported successfully' })
  message: string;

  @ApiProperty({ type: ItemResponseDto })
  data: ItemResponseDto;
}

export class GetItemsResponseDto {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: string;

  @ApiProperty({ example: 'Items retrieved successfully' })
  message: string;

  @ApiProperty({ type: [ItemResponseDto] })
  data: ItemResponseDto[];
}

export class GetRecentItemsResponseDto {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: string;

  @ApiProperty({ example: 'Recently lost items retrieved successfully' })
  message: string;

  @ApiProperty({ type: [ItemResponseDto] })
  data: ItemResponseDto[];

  @ApiProperty({
    type: Object,
    example: { limit: 20, offset: 0, total: 42 },
  })
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export class GetItemCountResponseDto {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: string;

  @ApiProperty({ example: 'Item count retrieved successfully' })
  message: string;

  @ApiProperty({ type: Object, example: { lost: 3, found: 5 } })
  data: { lost: number; found: number };
}