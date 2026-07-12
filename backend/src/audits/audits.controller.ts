import {
  Controller, Get, Post, Patch, Param, Body, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditsService } from './audits.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('audits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Post('cycles')
  @Roles(Role.ADMIN)
  async createCycle(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.auditsService.createCycle(body, userId);
  }

  @Get('cycles')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER)
  async findAllCycles() { return this.auditsService.findAllCycles(); }

  @Get('cycles/:id')
  async findCycle(@Param('id') id: string) { return this.auditsService.findCycle(id); }

  @Patch('items/:id/verify')
  async verifyItem(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @CurrentUser('id') userId: string,
  ) { return this.auditsService.verifyItem(id, body as any, userId); }

  @Post('cycles/:id/close')
  @Roles(Role.ADMIN)
  async closeCycle(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.auditsService.closeCycle(id, userId);
  }

  @Get('cycles/:id/discrepancy-report')
  async getDiscrepancyReport(@Param('id') id: string) {
    return this.auditsService.getDiscrepancyReport(id);
  }
}
