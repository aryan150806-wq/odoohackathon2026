import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/organization.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  // ─── Departments ──────────────────────────────────────────────────

  @Post('departments')
  @Roles(Role.ADMIN)
  async createDepartment(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orgService.createDepartment(dto, adminId);
  }

  @Get('departments')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async findAllDepartments() {
    return this.orgService.findAllDepartments();
  }

  @Get('departments/:id')
  @Roles(Role.ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD)
  async findDepartment(@Param('id') id: string) {
    return this.orgService.findDepartment(id);
  }

  @Patch('departments/:id')
  @Roles(Role.ADMIN)
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orgService.updateDepartment(id, dto, adminId);
  }

  // ─── Categories ───────────────────────────────────────────────────

  @Post('categories')
  @Roles(Role.ADMIN)
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orgService.createCategory(dto, adminId);
  }

  @Get('categories')
  async findAllCategories() {
    return this.orgService.findAllCategories();
  }

  @Get('categories/:id')
  async findCategory(@Param('id') id: string) {
    return this.orgService.findCategory(id);
  }

  @Patch('categories/:id')
  @Roles(Role.ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orgService.updateCategory(id, dto, adminId);
  }
}
