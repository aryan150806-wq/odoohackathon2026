import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { Role, MaintenanceStatus } from '@prisma/client';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  async create(
    @Body() body: { assetId: string; description: string; priority?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.create(body, userId);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.maintenanceService.transition(id, MaintenanceStatus.APPROVED, userId);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async reject(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.maintenanceService.transition(id, MaintenanceStatus.REJECTED, userId);
  }

  @Patch(':id/assign-technician')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async assignTechnician(
    @Param('id') id: string,
    @Body('technicianId') technicianId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.transition(
      id, MaintenanceStatus.TECHNICIAN_ASSIGNED, userId, { technicianId },
    );
  }

  @Patch(':id/start')
  async start(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.maintenanceService.transition(id, MaintenanceStatus.IN_PROGRESS, userId);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.maintenanceService.transition(id, MaintenanceStatus.RESOLVED, userId);
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('assetId') assetId?: string) {
    return this.maintenanceService.findAll({ status, assetId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }
}
