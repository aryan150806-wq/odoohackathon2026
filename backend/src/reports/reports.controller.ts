import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardKPIs() { return this.reportsService.getDashboardKPIs(); }

  @Get('asset-utilization')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async getAssetUtilization() { return this.reportsService.getAssetUtilization(); }

  @Get('maintenance-frequency')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async getMaintenanceFrequency() { return this.reportsService.getMaintenanceFrequency(); }

  @Get('department-allocation')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async getDepartmentAllocation() { return this.reportsService.getDepartmentAllocationSummary(); }

  @Get('booking-heatmap')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async getBookingHeatmap() { return this.reportsService.getBookingHeatmap(); }

  @Get('overdue')
  async getOverdue() { return this.reportsService.getOverdueAllocations(); }

  @Get('upcoming-returns')
  async getUpcomingReturns() { return this.reportsService.getUpcomingReturns(); }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    return this.reportsService.getRecentActivity(limit ? parseInt(limit) : 20);
  }
}
