import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class RolesController {
  constructor(private svc: RolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List all roles' })
  findRoles(
    @Query() query: PaginationQueryDto,
  ) {
    return this.svc.findAllRoles(query.page, query.limit);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get a singular role' })
  findRole(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findRole(id);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a role' })
  createRole(@Body() body: CreateRoleDto) {
    return this.svc.createRole(body);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update a role' })
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRoleDto) {
    return this.svc.updateRole(id, body);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete a role' })
  deleteRole(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteRole(id); }
}
