import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@ApiTags('Blog Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('blog-categories')
export class BlogCategoriesController {
  constructor(private svc: BlogsService) {}

  @Get()
    @ApiOperation({ summary: 'List blog categories' })
  findAllCategories() { return this.svc.findAllCategories(); }

  @Post()
    @ApiOperation({ summary: 'Create blog category' })
  createCategory(@Body() dto: CreateBlogCategoryDto) { return this.svc.createCategory(dto); }

  @Patch(':id')
    @ApiOperation({ summary: 'Update blog category' })
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogCategoryDto) {
    return this.svc.updateCategory(id, dto);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete blog category' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCategory(id);
  }
}
