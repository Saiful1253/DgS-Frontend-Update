import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ServicesService } from './services.service';
import { ReorderServicesDto } from './dto/reorder-services.dto';
import { ToggleServiceStatusDto } from './dto/toggle-service-status.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';
import { CreateServicePillarDto } from './dto/create-service-pillar.dto';
import { UpdateServicePillarDto } from './dto/update-service-pillar.dto';
import { ServiceQueryDto } from './dto/service-query.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get all active services and pillars for client panel' })
  async findAllPublic() {
    return this.servicesService.findAllPublic();
  }

  // Categories Endpoints (alias for pillars)
  @Get(['categories', 'pillars'])
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all service categories' })
  async findCategories() {
    return this.servicesService.findPillars();
  }

  @Post(['categories', 'pillars'])
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create service category' })
  async createCategory(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateServicePillarDto,
  ) {
    return this.servicesService.createPillar(dto);
  }

  @Patch(['categories/reorder', 'pillars/reorder'])
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reorder service categories' })
  async reorderCategories(@Body() body: ReorderServicesDto) {
    return this.servicesService.reorderPillars(body.order);
  }

  @Patch(['categories/:id', 'pillars/:id'])
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update service category' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateServicePillarDto,
  ) {
    return this.servicesService.updatePillar(id, dto);
  }

  @Delete(['categories/:id', 'pillars/:id'])
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete service category' })
  async removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.removePillar(id);
  }

  // Groups Endpoints
  @Get('groups')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List all service groups' })
  async findGroups(@Query('pillar') pillar?: string) {
    return this.servicesService.findGroups(pillar);
  }

  @Post('groups')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create service group' })
  async createGroup(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateServiceGroupDto,
  ) {
    return this.servicesService.createGroup(dto);
  }

  @Patch('groups/reorder')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Reorder service groups' })
  async reorderGroups(@Body() body: ReorderServicesDto) {
    return this.servicesService.reorderGroups(body.order);
  }

  @Patch('groups/:id/status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Toggle service group active status' })
  async toggleGroupStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ToggleServiceStatusDto,
  ) {
    return this.servicesService.toggleGroupStatus(id, body.is_active);
  }

  @Patch('groups/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update service group' })
  async updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateServiceGroupDto,
  ) {
    return this.servicesService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete service group' })
  async removeGroup(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.removeGroup(id);
  }

  // Services Endpoints
  @Get('stats')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get service module statistics' })
  async getStats() {
    return this.servicesService.getStats();
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List services with pagination, filter, search' })
  async findAll(@Query() query: ServiceQueryDto) {
    return this.servicesService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get service by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create service' })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateServiceDto,
  ) {
    return this.servicesService.create(dto);
  }

  @Patch('reorder')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Reorder services within a pillar' })
  async reorder(
    @Body() body: ReorderServicesDto,
  ) {
    return this.servicesService.reorder(body.order);
  }

  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Toggle service active status' })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ToggleServiceStatusDto,
  ) {
    return this.servicesService.toggleStatus(id, body.is_active);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update service' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete service (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }
}
