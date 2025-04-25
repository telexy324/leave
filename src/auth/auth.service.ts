import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string, phone?: string) {
    // 检查邮箱是否已被注册
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 如果提供了手机号，检查手机号是否已被注册
    if (phone) {
      const existingUserByPhone = await this.prisma.user.findUnique({
        where: { phone },
      });

      if (existingUserByPhone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
      },
    });

    // 创建初始的请假配额
    const currentYear = new Date().getFullYear();
    const leaveTypes = ['ANNUAL', 'SICK', 'PERSONAL'];
    const defaultQuotas = {
      ANNUAL: 12,
      SICK: 15,
      PERSONAL: 5,
    };

    // 为新用户创建请假配额
    await Promise.all(
      leaveTypes.map((type) =>
        this.prisma.leaveBalance.create({
          data: {
            userId: user.id,
            type: type,
            total: defaultQuotas[type],
            used: 0,
            year: currentYear,
          },
        }),
      ),
    );

    const { password: _, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}