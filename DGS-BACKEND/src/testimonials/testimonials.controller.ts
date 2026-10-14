import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { QueryTestimonialsDto } from './dto/query-testimonials.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('testimonials')
@UseGuards(JwtAuthGuard)
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get()
    async findAll(@Query() query: QueryTestimonialsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
    async create(@Body() body: CreateTestimonialDto) {
    return this.service.create(body);
  }

  @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateTestimonialDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
