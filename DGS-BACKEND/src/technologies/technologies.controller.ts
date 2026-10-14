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
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TechnologiesService } from './technologies.service';
import { ReorderTechnologiesDto } from './dto/reorder-technology.dto';
import { CreateTechnologyDto } from '../settings/dto/technology.dto';
import { UpdateTechnologyDto } from '../settings/dto/update-technology.dto';

@ApiTags('Technologies')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  // ── Categories Endpoints ──────────────────────────────────────────────────
  @Get('categories')
    @ApiOperation({ summary: 'List technology categories' })
  async findAllCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.technologiesService.findAllCategories(pageNum, limitNum);
  }

  @Post('categories')
    @ApiOperation({ summary: 'Create technology category' })
  async createCategory(@Body('name') name: string) {
    return this.technologiesService.createCategory(name);
  }

  @Put('categories/:id')
    @ApiOperation({ summary: 'Update technology category' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    return this.technologiesService.updateCategory(id, name);
  }

  @Delete('categories/:id')
    @ApiOperation({ summary: 'Delete technology category' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.technologiesService.deleteCategory(id);
  }

  // ── Technologies Endpoints ────────────────────────────────────────────────
  @Get()
    @ApiOperation({ summary: 'List all technologies with optional category filter' })
  async findAll(@Query('category') category?: string) {
    return this.technologiesService.findAll(category, true);
  }

  @Post()
    @ApiOperation({ summary: 'Create a new technology' })
  async create(@Body() body: CreateTechnologyDto) {
    return this.technologiesService.create(body);
  }

  @Patch('reorder')
    @ApiOperation({ summary: 'Reorder technologies in batch' })
  async reorder(@Body() body: ReorderTechnologiesDto) {
    // The body was an unvalidated inline type, so `body.order` reaching
    // `undefined` made reorder() return early and report success without
    // writing anything. class-validator now rejects the malformed payload.
    const duplicate = body.order.find(
      (item, i) => body.order.findIndex((o) => o.id === item.id) !== i,
    );
    if (duplicate) {
      throw new BadRequestException(`Duplicate id #${duplicate.id} in reorder payload`);
    }

    await this.technologiesService.reorder(body.order);
    return { success: true, message: 'Technologies reordered successfully' };
  }

  @Get(':id')
    @ApiOperation({ summary: 'Get technology by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.technologiesService.findOne(id);
  }

  @Put(':id')
    @ApiOperation({ summary: 'Update technology by id' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTechnologyDto,
  ) {
    return this.technologiesService.update(id, body);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete technology by id' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.technologiesService.remove(id);
  }
}
