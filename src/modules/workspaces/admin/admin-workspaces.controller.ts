import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminWorkspacesService } from './admin-workspaces.service';
import { AdminListWorkspacesQueryDto } from './dto/admin-list-workspaces-query.dto';
import {
  AdminUpdateWorkspacePlanDto,
  AdminWorkspaceActionResponseDto,
} from './dto/admin-update-workspace.dto';
import { AdminWorkspaceIdParamDto } from './dto/admin-workspace-id-param.dto';
import { AdminWorkspaceResponseDto } from './dto/admin-workspace-response.dto';

@ApiTags('Admin — Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GlobalAdminGuard)
@Controller('admin/workspaces')
export class AdminWorkspacesController {
  constructor(private readonly adminWorkspacesService: AdminWorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List all workspaces (admin)' })
  @ApiResponse({ status: 200, type: [AdminWorkspaceResponseDto], description: 'List of workspaces' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  listWorkspaces(
    @Query() query: AdminListWorkspacesQueryDto,
  ): Promise<AdminWorkspaceResponseDto[]> {
    return this.adminWorkspacesService.listWorkspaces(query);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get a single workspace by ID (admin)' })
  @ApiResponse({ status: 200, type: AdminWorkspaceResponseDto, description: 'Workspace details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  getWorkspace(
    @Param() params: AdminWorkspaceIdParamDto,
  ): Promise<AdminWorkspaceResponseDto> {
    return this.adminWorkspacesService.getWorkspace(params.workspaceId);
  }

  @Patch(':workspaceId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle verification status of a workspace (admin)' })
  @ApiResponse({ status: 200, type: AdminWorkspaceResponseDto, description: 'Verification toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  verifyWorkspace(
    @Param() params: AdminWorkspaceIdParamDto,
  ): Promise<AdminWorkspaceResponseDto> {
    return this.adminWorkspacesService.verifyWorkspace(params.workspaceId);
  }

  @Patch(':workspaceId/plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the subscription plan of a workspace (admin)' })
  @ApiResponse({ status: 200, type: AdminWorkspaceResponseDto, description: 'Plan updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  updatePlan(
    @Param() params: AdminWorkspaceIdParamDto,
    @Body() dto: AdminUpdateWorkspacePlanDto,
  ): Promise<AdminWorkspaceResponseDto> {
    return this.adminWorkspacesService.updatePlan(params.workspaceId, dto);
  }

  @Patch(':workspaceId/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a workspace (admin)' })
  @ApiResponse({ status: 200, type: AdminWorkspaceResponseDto, description: 'Workspace suspended' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  suspendWorkspace(
    @Param() params: AdminWorkspaceIdParamDto,
  ): Promise<AdminWorkspaceResponseDto> {
    return this.adminWorkspacesService.suspendWorkspace(params.workspaceId);
  }

  @Patch(':workspaceId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a suspended workspace (admin)' })
  @ApiResponse({ status: 200, type: AdminWorkspaceResponseDto, description: 'Workspace activated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  activateWorkspace(
    @Param() params: AdminWorkspaceIdParamDto,
  ): Promise<AdminWorkspaceResponseDto> {
    return this.adminWorkspacesService.activateWorkspace(params.workspaceId);
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard-delete a workspace (admin)' })
  @ApiResponse({ status: 200, type: AdminWorkspaceActionResponseDto, description: 'Workspace deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Global admin access required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  deleteWorkspace(
    @Param() params: AdminWorkspaceIdParamDto,
  ): Promise<AdminWorkspaceActionResponseDto> {
    return this.adminWorkspacesService.deleteWorkspace(params.workspaceId);
  }
}
