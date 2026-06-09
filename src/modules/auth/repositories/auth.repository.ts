import { Injectable } from '@nestjs/common';
import {
  OAuthProvider,
  type PasswordReset,
  type Prisma,
  type TwoFactorBackupCode,
  type Session,
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

  createSession(data: Prisma.SessionUncheckedCreateInput) {
    return this.prisma.session.create({ data });
  }

  findSessionByHash(tokenHash: string) {
    return this.prisma.session.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  findSessionById(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  findActiveSessionsByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  revokeSession(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  touchSession(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  revokeAllSessionsForUser(userId: string) {
    return this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  revokeOtherSessionsForUser(userId: string, currentSessionId: string) {
    return this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
        id: { not: currentSessionId },
      },
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

  deleteTwoFactorBackupCodesForUser(userId: string) {
    return this.prisma.twoFactorBackupCode.deleteMany({
      where: { userId },
    });
  }

  createTwoFactorBackupCodes(data: Prisma.TwoFactorBackupCodeUncheckedCreateInput[]) {
    return this.prisma.twoFactorBackupCode.createMany({
      data,
    });
  }

  findUnusedBackupCodeByHash(userId: string, codeHash: string) {
    return this.prisma.twoFactorBackupCode.findFirst({
      where: {
        userId,
        codeHash,
        usedAt: null,
      },
    });
  }

  markBackupCodeUsed(id: string) {
    return this.prisma.twoFactorBackupCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
