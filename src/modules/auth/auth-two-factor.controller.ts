import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';

@ApiTags('Auth 2FA')
@Controller('auth/2fa')
export class AuthTwoFactorController {
  constructor(private readonly authTwoFactorService: AuthTwoFactorService) {}

  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a TOTP secret and QR code for 2FA setup' })
  @ApiResponse({ status: 200, type: AuthTwoFactorEnableResponseDto })
  enable(@CurrentUser() user: AuthUser): Promise<AuthTwoFactorEnableResponseDto> {
    return this.authTwoFactorService.enable(user);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify the first TOTP code and activate 2FA' })
  @ApiResponse({ status: 200, type: AuthTwoFactorBackupCodesResponseDto })
  confirm(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmTwoFactorDto,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    return this.authTwoFactorService.confirm(user, dto);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA using the current password' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
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
  verify(@Body() dto: VerifyTwoFactorDto): Promise<AuthLoginResponseDto> {
    return this.authTwoFactorService.verify(dto);
  }

  @Get('backup-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the most recently generated backup codes' })
  @ApiResponse({ status: 200, type: AuthTwoFactorBackupCodesResponseDto })
  getBackupCodes(
    @CurrentUser() user: AuthUser,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    return this.authTwoFactorService.getBackupCodes(user);
  }

  @Post('backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate backup codes for 2FA' })
  @ApiResponse({ status: 200, type: AuthTwoFactorBackupCodesResponseDto })
  regenerateBackupCodes(
    @CurrentUser() user: AuthUser,
  ): Promise<AuthTwoFactorBackupCodesResponseDto> {
    return this.authTwoFactorService.regenerateBackupCodes(user);
  }
}
