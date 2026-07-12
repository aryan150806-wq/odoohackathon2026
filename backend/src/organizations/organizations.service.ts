import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Department CRUD ──────────────────────────────────────────────

  async createDepartment(dto: CreateDepartmentDto, adminId: string) {
    const existing = await this.prisma.department.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Department name already exists');

    const department = await this.prisma.department.create({
      data: dto,
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'DEPARTMENT_CREATED',
        entityType: 'Department',
        entityId: department.id,
        details: { name: dto.name },
      },
    });

    return department;
  }

  async findAllDepartments() {
    return this.prisma.department.findMany({
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { members: true, assets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findDepartment(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { members: true, assets: true } },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto, adminId: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');

    if (dto.name && dto.name !== dept.name) {
      const existing = await this.prisma.department.findUnique({
        where: { name: dto.name },
      });
      if (existing) throw new ConflictException('Department name already exists');
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: dto,
      include: {
        head: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'DEPARTMENT_UPDATED',
        entityType: 'Department',
        entityId: id,
        details: { changes: dto as any },
      },
    });

    return updated;
  }

  // ─── Category CRUD ────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto, adminId: string) {
    const existing = await this.prisma.assetCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Category name already exists');

    const category = await this.prisma.assetCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        customFields: dto.customFields ? JSON.parse(JSON.stringify(dto.customFields)) : [],
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'CATEGORY_CREATED',
        entityType: 'AssetCategory',
        entityId: category.id,
        details: { name: dto.name },
      },
    });

    return category;
  }

  async findAllCategories() {
    return this.prisma.assetCategory.findMany({
      include: {
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategory(id: string) {
    const category = await this.prisma.assetCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { assets: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, adminId: string) {
    const category = await this.prisma.assetCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.assetCategory.findUnique({
        where: { name: dto.name },
      });
      if (existing) throw new ConflictException('Category name already exists');
    }

    const updated = await this.prisma.assetCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.customFields && { customFields: JSON.parse(JSON.stringify(dto.customFields)) }),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'CATEGORY_UPDATED',
        entityType: 'AssetCategory',
        entityId: id,
        details: { changes: dto as any },
      },
    });

    return updated;
  }
}
