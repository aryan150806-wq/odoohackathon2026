import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AllocationsService } from './allocations.service';
import {
  CreateAllocationDto,
  ReturnAssetDto,
  CreateTransferRequestDto,
} from './dto/allocation.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('allocations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Get('check/:assetId')
  async canAllocate(@Param('assetId') assetId: string) {
    return this.allocationsService.canAllocate(assetId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async allocate(
    @Body() dto: CreateAllocationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.allocationsService.allocate(dto, userId);
  }

  @Patch(':id/return')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async returnAsset(
    @Param('id') id: string,
    @Body() dto: ReturnAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.allocationsService.returnAsset(id, dto, userId);
  }

  @Post('transfer-requests')
  async createTransferRequest(
    @Body() dto: CreateTransferRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.allocationsService.createTransferRequest(dto, userId);
  }

  @Patch('transfer-requests/:id/approve')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async approveTransfer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.allocationsService.approveTransfer(id, userId);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('assetId') assetId?: string,
  ) {
    return this.allocationsService.findAll({ status, userId, assetId });
  }

  @Get('overdue')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async getOverdue() {
    return this.allocationsService.getOverdue();
  }

  @Get('transfer-requests')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async getTransferRequests(@Query('status') status?: string) {
    return this.allocationsService.getTransferRequests({ status });
  }
}
