import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { AuthActionResponseDto } from './dto/auth-action-response.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthTwoFactorBackupCodesResponseDto } from './dto/auth-two-factor-backup-codes-response.dto';
import { AuthTwoFactorEnableResponseDto } from './dto/auth-two-factor-enable-response.dto';
import { ConfirmTwoFactorDto } from './dto/confirm-two-factor.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { RegenerateBackupCodesDto } from './dto/regenerate-backup-codes.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { setAuthCookies } from './auth-cookies.util';

@ApiTags('Auth 2FA')
@Controller('auth/2fa')
export class AuthTwoFactorController {
  constructor(private readonly authTwoFactorService: AuthTwoFactorService) {}

  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a TOTP secret and QR code for 2FA setup' })
  @ApiResponse({ status: 200, type: AuthTwoFactorEnableResponseDto })
  @ApiResponse({ status: 400, description: '2FA is already enabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  enable(@CurrentUser() user: AuthUser): Promise<AuthTwoFactorEnableResponseDto> {
    return this.authTwoFactorService.enable(user);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the first TOTP code and activate 2FA' })
  @ApiResponse({ status: 200, type: AuthTwoFactorBackupCodesResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code or 2FA not yet set up' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  confirm(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmTwoFactorDto,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    return this.authTwoFactorService.confirm(user, dto);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA using the current password' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  @ApiResponse({ status: 400, description: '2FA is not enabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized or password is incorrect' })
  disable(
    @CurrentUser() user: AuthUser,
    @Body() dto: DisableTwoFactorDto,
  ): Promise<AuthActionResponseDto> {
    return this.authTwoFactorService.disable(user, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a 2FA code during login' })
  @ApiResponse({ status: 200, type: AuthLoginResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired 2FA code or challenge token' })
  async verify(
    @Body() dto: VerifyTwoFactorDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    const result = await this.authTwoFactorService.verify(dto);
    if (result.session) {
      setAuthCookies(res, result.session.tokens);
    }
    return result;
  }

  @Get('backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the most recently generated backup codes' })
  @ApiResponse({ status: 200, type: AuthTwoFactorBackupCodesResponseDto })
  @ApiResponse({ status: 400, description: '2FA is not enabled or no backup codes available' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getBackupCodes(
    @CurrentUser() user: AuthUser,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    return this.authTwoFactorService.getBackupCodes(user);
  }

  @Post('backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes for 2FA (requires current password)' })
  @ApiResponse({ status: 200, type: AuthTwoFactorBackupCodesResponseDto })
  @ApiResponse({ status: 400, description: '2FA is not enabled' })
  @ApiResponse({ status: 401, description: 'Unauthorized or password is incorrect' })
  regenerateBackupCodes(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegenerateBackupCodesDto,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    return this.authTwoFactorService.regenerateBackupCodes(user, dto);
  }
}
