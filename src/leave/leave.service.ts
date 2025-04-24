import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveType, RequestStatus, Role } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async createLeaveRequest(userId: number, data: {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 计算请假天数
    const days = Math.ceil(
      (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // 检查是否有足够的假期
    if (user.leaveDays < days) {
      throw new ForbiddenException('Not enough leave days');
    }

    return this.prisma.leaveRequest.create({
      data: {
        ...data,
        userId,
        status: RequestStatus.PENDING,
      },
    });
  }

  async getLeaveRequests(userId: number) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequests() {
    return this.prisma.leaveRequest.findMany({
      where: { status: RequestStatus.PENDING },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeaveRequestStatus(
    requestId: number,
    status: RequestStatus,
    userId: number,
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update request status');
    }

    // 如果申请被批准，扣除用户的假期天数
    if (status === RequestStatus.APPROVED && request.status === RequestStatus.PENDING) {
      const days = Math.ceil(
        (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      await this.prisma.user.update({
        where: { id: request.userId },
        data: {
          leaveDays: {
            decrement: days,
          },
        },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  async updateUserLeaveDays(userId: number, days: number, adminId: number) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can update leave days');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { leaveDays: days },
    });
  }
} 