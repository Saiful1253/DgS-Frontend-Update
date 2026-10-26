import {
  Controller,
  Get,
  Post,
  Put,
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
import { WhyChooseUsService } from './why-choose-us.service';
import { CreateWhyChooseUsDto } from './dto/create-why-choose-us.dto';
import { UpdateWhyChooseUsDto } from './dto/update-why-choose-us.dto';
import { QueryWhyChooseUsDto } from './dto/query-why-choose-us.dto';
import { ReorderWhyChooseUsDto } from './dto/reorder-why-choose-us.dto';

import { UpdateWhyChooseUsMetricsDto } from './dto/why-choose-us-metrics.dto';

@ApiTags('Why Choose Us')
@Controller(['services/why-choose-us', 'why-choose-us'])
export class WhyChooseUsController {
  constructor(private readonly service: WhyChooseUsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get active Why Choose Us items for client panel' })
  async findAllPublic() {
    return this.service.findAllPublic();
  }

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Get Why Choose Us statistics strip metrics' })
  async getMetrics() {
    return this.service.getMetrics();
  }

  @Put('metrics')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update Why Choose Us statistics strip metrics' })
  async updateMetrics(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }))
    dto: UpdateWhyChooseUsMetricsDto,
  ) {
    return this.service.updateMetrics(dto);
  }

  @Get('stats')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Why Choose Us statistics' })
  async getStats() {
    return this.service.getStats();
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List Why Choose Us items with pagination and filters' })
  async findAll(@Query() query: QueryWhyChooseUsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single Why Choose Us item by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new Why Choose Us item' })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateWhyChooseUsDto,
  ) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update Why Choose Us item' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateWhyChooseUsDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle Why Choose Us item active status' })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('is_active') isActive: boolean,
  ) {
    return this.service.toggleStatus(id, Boolean(isActive));
  }

  @Patch('reorder')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reorder Why Choose Us items' })
  async reorder(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ReorderWhyChooseUsDto,
  ) {
    await this.service.reorder(body.order);
    return { success: true };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft delete Why Choose Us item' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
