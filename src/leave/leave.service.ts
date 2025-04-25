import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, UpdateLeaveDto } from './dto/leave.dto';
import { LeaveStatus, Role } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createLeaveDto: CreateLeaveDto) {
    // 检查请假配额
    const leaveBalance = await this.prisma.leaveBalance.findUnique({
      where: {
        userId_type_year: {
          userId,
          type: createLeaveDto.type,
          year: new Date().getFullYear(),
        },
      },
    });

    if (!leaveBalance) {
      throw new ForbiddenException('没有可用的请假配额');
    }

    const startDate = new Date(createLeaveDto.startDate);
    const endDate = new Date(createLeaveDto.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (leaveBalance.total - leaveBalance.used < days) {
      throw new ForbiddenException('请假天数超过剩余配额');
    }

    return this.prisma.leave.create({
      data: {
        ...createLeaveDto,
        userId,
        startDate,
        endDate,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.leave.findMany({
        include: {
          user: true,
          approvedBy: true,
        },
      });
    }

    return this.prisma.leave.findMany({
      where: {
        userId,
      },
      include: {
        approvedBy: true,
      },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
      include: {
        user: true,
        approvedBy: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('请假申请不存在');
    }

    if (role !== Role.ADMIN && leave.userId !== userId) {
      throw new ForbiddenException('无权访问此请假申请');
    }

    return leave;
  }

  async approve(id: string, approverId: string, comment: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!leave) {
      throw new NotFoundException('请假申请不存在');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ForbiddenException('该请假申请已被处理');
    }

    // 更新请假余额
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    await this.prisma.leaveBalance.update({
      where: {
        userId_type_year: {
          userId: leave.userId,
          type: leave.type,
          year: new Date().getFullYear(),
        },
      },
      data: {
        used: {
          increment: days,
        },
      },
    });

    return this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approverId,
        comment,
      },
      include: {
        user: true,
        approvedBy: true,
      },
    });
  }

  async reject(id: string, approverId: string, comment: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
    });

    if (!leave) {
      throw new NotFoundException('请假申请不存在');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new ForbiddenException('该请假申请已被处理');
    }

    return this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approverId,
        comment,
      },
      include: {
        user: true,
        approvedBy: true,
      },
    });
  }
} 