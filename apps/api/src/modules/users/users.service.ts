import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrFail(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Nutzer nicht gefunden');
    return user;
  }

  findByHandle(handle: string) {
    return this.prisma.user.findUnique({ where: { handle } });
  }

  async findOrCreate(email: string) {
    const existing = await this.findByEmail(email);
    if (existing) return existing;

    // Eindeutiger Handle aus zufälligen Bytes — z.B. "u3f8a1c2d"
    const handle = `u${crypto.randomBytes(4).toString('hex')}`;
    return this.prisma.user.create({
      data: { email, handle, role: 'user' },
    });
  }
}
