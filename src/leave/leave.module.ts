import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LeaveController],
  providers: [LeaveService, PrismaService],
  exports: [LeaveService],
})
export class LeaveModule {} 