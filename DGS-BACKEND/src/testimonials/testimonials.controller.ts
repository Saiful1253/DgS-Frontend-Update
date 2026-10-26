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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TestimonialsService } from './testimonials.service';
import { QueryTestimonialsDto } from './dto/query-testimonials.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerConfig } from '../upload/multer.config';

@Controller('testimonials')
@UseGuards(JwtAuthGuard)
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get()
  async findAll(@Query() query: QueryTestimonialsDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('data') data?: string,
    @Body() directBody?: any,
  ) {
    let dto: Record<string, any> = {};
    if (data) {
      try {
        dto = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        throw new BadRequestException('Invalid JSON in "data" field');
      }
    } else {
      dto = directBody || {};
    }
    return this.service.create(dto, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('data') data?: string,
    @Body() directBody?: any,
  ) {
    let dto: Record<string, any> = {};
    if (data) {
      try {
        dto = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        throw new BadRequestException('Invalid JSON in "data" field');
      }
    } else {
      dto = directBody || {};
    }
    return this.service.update(id, dto, file);
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
  ) {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }
    return this.service.setStatus(id, status);
  }

  @Patch(':id/featured')
  async setFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body('is_featured') is_featured: boolean,
  ) {
    return this.service.setFeatured(id, Boolean(is_featured));
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
