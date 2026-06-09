import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GlobalAdminGuard } from '../../../common/guards/global-admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { AdminUsersService } from './admin-users.service';
import { AdminGetUserParamDto } from './dto/admin-get-user-param.dto';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
import { AdminUserActionResponseDto } from './dto/admin-user-action-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { AdminUsersListResponseDto } from './dto/admin-users-list-response.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GlobalAdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users for global admins' })
  @ApiResponse({ status: 200, type: AdminUsersListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only global admins can access this resource',
  })
  listUsers(
    @Query() query: AdminListUsersQueryDto,
  ): Promise<AdminUsersListResponseDto> {
    return this.adminUsersService.listUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user for global admins' })
  @ApiResponse({ status: 200, type: AdminUserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only global admins can access this resource',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(
    @Param() params: AdminGetUserParamDto,
  ): Promise<AdminUserResponseDto> {
    return this.adminUsersService.getUserById(params.id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user for global admins' })
  @ApiResponse({ status: 200, type: AdminUserActionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only global admins can access this resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  activateUser(
    @Param() params: AdminGetUserParamDto,
  ): Promise<AdminUserActionResponseDto> {
    return this.adminUsersService.activateUser(params.id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user for global admins' })
  @ApiResponse({ status: 200, type: AdminUserActionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only global admins can access this resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivateUser(
    @Param() params: AdminGetUserParamDto,
  ): Promise<AdminUserActionResponseDto> {
    return this.adminUsersService.deactivateUser(params.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user for global admins' })
  @ApiResponse({ status: 200, type: AdminUserActionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only global admins can access this resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  softDeleteUser(
    @CurrentUser() currentUser: AuthUser,
    @Param() params: AdminGetUserParamDto,
  ): Promise<AdminUserActionResponseDto> {
    return this.adminUsersService.softDeleteUser(currentUser, params.id);
  }
}
