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
import { CreateLeaveDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Request() req, @Body() createLeaveDto: CreateLeaveDto) {
    return this.leaveService.create(req.user.id, createLeaveDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.leaveService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.leaveService.findOne(id, req.user.id, req.user.role);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN)
  approve(
    @Request() req,
    @Param('id') id: string,
    @Body('comment') comment: string,
  ) {
    return this.leaveService.approve(id, req.user.id, comment);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN)
  reject(
    @Request() req,
    @Param('id') id: string,
    @Body('comment') comment: string,
  ) {
    return this.leaveService.reject(id, req.user.id, comment);
  }
} 