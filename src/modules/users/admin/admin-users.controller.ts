import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GlobalAdminGuard } from '../../../common/guards/global-admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminGetUserParamDto } from './dto/admin-get-user-param.dto';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
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
}
