import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { itemTypes } from 'src/db/schema';

export class SearchItemsQueryDto {
  @ApiProperty({ example: 'phone', description: 'Search keyword (required)' })
  @IsString()
  @IsNotEmpty({ message: 'Search query is required' })
  q: string;

  @ApiProperty({ example: 'LOST', enum: itemTypes, required: false, description: 'Filter by item type' })
  @IsEnum(itemTypes, { message: 'type must be LOST or FOUND' })
  @IsOptional()
  type?: itemTypes;

  @ApiProperty({ example: 'Library', required: false, description: 'Filter by location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Electronics', required: false, description: 'Filter by category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 10, required: false, description: 'Number of results to return (1-100, default: 10)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @IsOptional()
  limit: number = 10;

  @ApiProperty({ example: 0, required: false, description: 'Pagination offset (default: 0)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Offset cannot be negative' })
  @IsOptional()
  offset: number = 0;
}

export class SearchItemResponseDto {
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

  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED'] })
  status: string;

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

  @ApiProperty({ example: 0.75, description: 'Weighted similarity score (0-1)' })
  matchScore: number;
}

export class SearchItemsResponseDto {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: string;

  @ApiProperty({ example: 'Search completed successfully' })
  message: string;

  @ApiProperty({ type: [SearchItemResponseDto] })
  data: SearchItemResponseDto[];

  @ApiProperty({ example: { total: 15, limit: 10, offset: 0 } })
  pagination: {
    limit: number;
    offset: number;
  };
}