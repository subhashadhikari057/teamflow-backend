import { Injectable } from '@nestjs/common';
import {
  OAuthProvider,
  type OAuthAccount,
  type PasswordReset,
  type Prisma,
  type RefreshToken,
  type User,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  findUserByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: { username, deletedAt: null },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  revokeAllRefreshTokensForUser(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  createPasswordReset(data: Prisma.PasswordResetUncheckedCreateInput) {
    return this.prisma.passwordReset.create({ data });
  }

  findPasswordResetByHash(tokenHash: string) {
    return this.prisma.passwordReset.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  markPasswordResetUsed(id: string) {
    return this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  findOAuthAccount(provider: OAuthProvider, providerAccountId: string) {
    return this.prisma.oAuthAccount.findFirst({
      where: { provider, providerAccountId },
      include: { user: true },
    });
  }

  createOAuthAccount(data: Prisma.OAuthAccountUncheckedCreateInput) {
    return this.prisma.oAuthAccount.create({ data });
  }

  updateOAuthAccount(id: string, data: Prisma.OAuthAccountUpdateInput) {
    return this.prisma.oAuthAccount.update({
      where: { id },
      data,
    });
  }

  findUserByVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: { verificationToken: token, deletedAt: null },
    });
  }
}
