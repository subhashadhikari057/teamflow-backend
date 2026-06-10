import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuthActionResponseDto } from './dto/auth-action-response.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { AUTH_ERROR_CODES } from './auth.types';
import { AppException } from '../../common/exceptions/app.exception';
import { OAuthAuthorizationQueryDto } from './dto/oauth-authorization-query.dto';
import { OAuthCallbackQueryDto } from './dto/oauth-callback-query.dto';
import { OAuthRedirectResponseDto } from './dto/oauth-redirect-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';
import { setAuthCookies, clearAuthCookies } from './auth-cookies.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, type: AuthActionResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  register(@Body() dto: RegisterDto): Promise<AuthActionResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email or username and password' })
  @ApiResponse({ status: 200, type: AuthLoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email is not verified' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    const result = await this.authService.login(dto);
    if (!result.requiresTwoFactor && result.session) {
      setAuthCookies(res, result.session.tokens);
    }
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and revoke a refresh token' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthActionResponseDto> {
    const refreshToken = (req as any).cookies?.refresh_token;
    if (!refreshToken) {
      throw new AppException(
        AUTH_ERROR_CODES.REFRESH_TOKEN_NOT_FOUND,
        'Refresh token not found',
        { status: HttpStatus.NOT_FOUND },
      );
    }
    const result = await this.authService.logout(user, { refreshToken });
    clearAuthCookies(res);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new session' })
  @ApiResponse({ status: 200, type: AuthSessionResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponseDto> {
    console.log('[Auth] Refresh token endpoint hit');
    const refreshToken = (req as any).cookies?.refresh_token;
    if (!refreshToken) {
      throw new AppException(
        AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token is missing',
        { status: HttpStatus.UNAUTHORIZED },
      );
    }
    const result = await this.authService.refresh({ refreshToken });
    setAuthCookies(res, result.tokens);
    return result;
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a user email using a verification token' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<AuthActionResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the email verification token' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<AuthActionResponseDto> {
    return this.authService.resendVerification(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<AuthActionResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password using a reset token' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<AuthActionResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the password for the authenticated user' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<AuthActionResponseDto> {
    return this.authService.changePassword(user, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, type: AuthUserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@CurrentUser() user: AuthUser): Promise<AuthUserResponseDto> {
    return this.authService.me(user);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiResponse({ status: 200, type: AuthUserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthUserResponseDto> {
    return this.authService.updateProfile(user, dto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Generate the Google OAuth authorization URL' })
  @ApiResponse({ status: 200, type: OAuthRedirectResponseDto })
  google(
    @Query() query: OAuthAuthorizationQueryDto,
  ): Promise<OAuthRedirectResponseDto> {
    return this.authService.getGoogleAuthorizationUrl(
      query.redirectUri,
      query.clientState,
    );
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle the Google OAuth callback' })
  @ApiResponse({ status: 200, type: AuthSessionResponseDto })
  @ApiResponse({ status: 400, description: 'OAuth callback failed' })
  googleCallback(
    @Query() query: OAuthCallbackQueryDto,
  ): Promise<AuthSessionResponseDto> {
    return this.authService.handleGoogleCallback(query.code, query.state);
  }

  @Get('github')
  @ApiOperation({ summary: 'Generate the GitHub OAuth authorization URL' })
  @ApiResponse({ status: 200, type: OAuthRedirectResponseDto })
  github(
    @Query() query: OAuthAuthorizationQueryDto,
  ): Promise<OAuthRedirectResponseDto> {
    return this.authService.getGithubAuthorizationUrl(
      query.redirectUri,
      query.clientState,
    );
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'Handle the GitHub OAuth callback' })
  @ApiResponse({ status: 200, type: AuthSessionResponseDto })
  @ApiResponse({ status: 400, description: 'OAuth callback failed' })
  githubCallback(
    @Query() query: OAuthCallbackQueryDto,
  ): Promise<AuthSessionResponseDto> {
    return this.authService.handleGithubCallback(query.code, query.state);
  }
}
