import { IsEnum, IsDateString, IsString, IsOptional } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @IsEnum(LeaveType)
  type: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  proof?: string;
}

export class UpdateLeaveDto {
  @IsEnum(LeaveType)
  @IsOptional()
  type?: LeaveType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  proof?: string;
} 