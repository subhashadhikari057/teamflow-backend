import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuthActionResponseDto } from './dto/auth-action-response.dto';
import { AuthSessionIdParamDto } from './dto/auth-session-id-param.dto';
import { AuthSessionsListResponseDto } from './dto/auth-sessions-list-response.dto';
import { AuthSessionsService } from './auth-sessions.service';

@ApiTags('Auth Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/sessions')
export class AuthSessionsController {
  constructor(private readonly authSessionsService: AuthSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active sessions for the authenticated user' })
  @ApiResponse({ status: 200, type: AuthSessionsListResponseDto })
  listSessions(@CurrentUser() user: AuthUser): Promise<AuthSessionsListResponseDto> {
    return this.authSessionsService.listActiveSessions(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session for the authenticated user' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  revokeSession(
    @CurrentUser() user: AuthUser,
    @Param() params: AuthSessionIdParamDto,
  ): Promise<AuthActionResponseDto> {
    return this.authSessionsService.revokeSessionById(user, params.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Revoke all sessions except the current session' })
  @ApiResponse({ status: 200, type: AuthActionResponseDto })
  revokeOtherSessions(
    @CurrentUser() user: AuthUser,
  ): Promise<AuthActionResponseDto> {
    return this.authSessionsService.revokeOtherSessions(user);
  }
}
