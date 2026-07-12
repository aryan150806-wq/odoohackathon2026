import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateRoleDto, UpdateUserStatusDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List users — Admin sees all, Dept Head sees own department.
   */
  async findAll(currentUser: { role: Role; departmentId: string | null }) {
    const where: any = {};

    if (currentUser.role === 'DEPARTMENT_HEAD') {
      if (!currentUser.departmentId) {
        return [];
      }
      where.departmentId = currentUser.departmentId;
    } else if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ASSET_MANAGER') {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single user by ID.
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Update user profile (name, department).
   */
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        status: true,
      },
    });
  }

  /**
   * Promote/demote user role — Admin only.
   * Writes ActivityLog entry with old and new role.
   */
  async updateRole(id: string, dto: UpdateRoleDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        status: true,
      },
    });

    // Log the role change
    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'ROLE_PROMOTED',
        entityType: 'User',
        entityId: id,
        details: {
          oldRole,
          newRole: dto.role,
          promotedUser: user.email,
        },
      },
    });

    return updatedUser;
  }

  /**
   * Activate/deactivate user — Admin only.
   */
  async updateStatus(id: string, dto: UpdateUserStatusDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'USER_STATUS_CHANGED',
        entityType: 'User',
        entityId: id,
        details: {
          newStatus: dto.status,
          userEmail: user.email,
        },
      },
    });

    return updatedUser;
  }
}
