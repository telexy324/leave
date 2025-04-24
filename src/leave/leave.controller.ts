import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaveType, RequestStatus } from '@prisma/client';

@Controller('leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('request')
  async createLeaveRequest(
    @Request() req,
    @Body() data: {
      type: LeaveType;
      startDate: Date;
      endDate: Date;
      reason: string;
    },
  ) {
    return this.leaveService.createLeaveRequest(req.user.id, data);
  }

  @Get('my-requests')
  async getMyLeaveRequests(@Request() req) {
    return this.leaveService.getLeaveRequests(req.user.id);
  }

  @Get('pending')
  async getPendingRequests() {
    return this.leaveService.getPendingRequests();
  }

  @Post('request/:id/status')
  async updateLeaveRequestStatus(
    @Param('id') requestId: string,
    @Request() req,
    @Body('status') status: RequestStatus,
  ) {
    return this.leaveService.updateLeaveRequestStatus(
      parseInt(requestId),
      status,
      req.user.id,
    );
  }

  @Post('user/:id/days')
  async updateUserLeaveDays(
    @Param('id') userId: string,
    @Request() req,
    @Body('days') days: number,
  ) {
    return this.leaveService.updateUserLeaveDays(
      parseInt(userId),
      days,
      req.user.id,
    );
  }
} 