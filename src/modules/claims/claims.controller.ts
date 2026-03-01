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
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { responseStatus } from 'src/db/schema/enums';
import { CLAIMS_SERVICE, IClaimsService } from './interface/claims-service.interface';
import { CreateClaimDto, ClaimResponseDto } from './dto/claims.dto';

class PaginationQueryDto {
  limit: number = 10;
  offset: number = 0;
}

class AdminMetricsDto {
  totalReports: number;
  pendingApprovals: number;
  resolvedCases: number;
}

@ApiTags('Claims')
@Controller('claims')
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(
    @Inject(CLAIMS_SERVICE)
    private readonly claimsService: IClaimsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('proofImage'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Claim submitted successfully', type: ClaimResponseDto })
  async submitClaim(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateClaimDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let proofImageUrl: string | undefined;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        proofImageUrl = uploadResult.url;
      } catch (error) {
        this.logger.error('Error uploading proof image to Cloudinary:', error);
        throw error;
      }
    }

    const claim = await this.claimsService.submitClaim(userId, dto, proofImageUrl);

    return {
      status: responseStatus.SUCCESS,
      message: 'Claim submitted successfully',
      data: claim,
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Your claims retrieved successfully' })
  async getMyClaims(
    @CurrentUser('id') userId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    const result = await this.claimsService.getMyClaims(userId, limit, offset);

    return {
      status: responseStatus.SUCCESS,
      message: 'Your claims retrieved successfully',
      data: result.claims,
      pagination: {
        limit,
        offset,
        total: result.total,
      },
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'All claims retrieved successfully' })
  async getAllClaims(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    const result = await this.claimsService.getAllClaims(limit, offset);

    return {
      status: responseStatus.SUCCESS,
      message: 'All claims retrieved successfully',
      data: result.claims,
      pagination: {
        limit,
        offset,
        total: result.total,
      },
    };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Claim retrieved successfully', type: ClaimResponseDto })
  async getClaimById(@Param('id') claimId: string) {
    const claim = await this.claimsService.getClaimById(claimId);

    return {
      status: responseStatus.SUCCESS,
      message: 'Claim retrieved successfully',
      data: claim,
    };
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Claim approved successfully', type: ClaimResponseDto })
  async approveClaim(@Param('id') claimId: string) {
    const claim = await this.claimsService.approveClaim(claimId);

    return {
      status: responseStatus.SUCCESS,
      message: 'Claim approved successfully',
      data: claim,
    };
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Claim rejected successfully', type: ClaimResponseDto })
  async rejectClaim(@Param('id') claimId: string) {
    const claim = await this.claimsService.rejectClaim(claimId);

    return {
      status: responseStatus.SUCCESS,
      message: 'Claim rejected successfully',
      data: claim,
    };
  }
}
