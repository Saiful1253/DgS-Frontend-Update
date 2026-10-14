import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe, UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateBlogDto, BLOG_STATUSES } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ChangeBlogStatusDto } from './dto/change-blog-status.dto';
import { ToggleBlogFeaturedDto } from './dto/toggle-blog-featured.dto';
import { UpsertBlogSeoDto } from './dto/upsert-blog-seo.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { BlogsService } from './blogs.service';
import { multerConfig } from '../upload/multer.config';

@ApiTags('Blogs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('blogs')
export class BlogsController {
  constructor(private svc: BlogsService) {}

  @Get()
    @ApiOperation({ summary: 'List blogs — paginated, filterable by status/search/category' })
  @ApiQuery({ name: 'page',     required: false })
  @ApiQuery({ name: 'limit',    required: false })
  @ApiQuery({ name: 'status',   required: false, enum: ['draft', 'internal_review', 'scheduled', 'published', 'archived'] })
  @ApiQuery({ name: 'search',   required: false, description: 'ILIKE title/excerpt/category' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'featured', required: false, description: 'featured_status boolean' })
  findBlogs(
    @Query('page')     page = 1,
    @Query('limit')    limit = 10,
    @Query('status')   status?: string,
    @Query('search')   search?: string,
    @Query('category') category?: string,
    @Query('featured') featured?: string,
  ) {
    return this.svc.findBlogs(+page, +limit, status, search, category, featured === 'true');
  }

  @Get(':id')
    @ApiOperation({ summary: 'Get blog by ID — includes content + content_delta for Quill restore' })
  findBlog(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findBlog(id);
  }

  @Post()
    @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'og_image', maxCount: 1 },
  ], multerConfig))
  @ApiOperation({ summary: 'Create blog — featured + OG image files + data JSON in one request' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Featured image (optional)' },
        og_image: { type: 'string', format: 'binary', description: 'Open Graph image (optional)' },
        data: {
          type: 'string',
          description: 'JSON string of blog data',
          example: '{"title":"My Blog","content":"<p>Hello</p>","content_delta":{"ops":[]},"status":"draft"}',
        },
      },
    },
  })
  async createBlog(
    @UploadedFiles() files: { file?: Express.Multer.File[]; og_image?: Express.Multer.File[] },
    @Body('data') data: string,
  ) {
    const parsedData = JSON.parse(data);
    const dto = plainToInstance(CreateBlogDto, parsedData);
    await validateOrReject(dto);

    return this.svc.createBlog(dto, files?.file?.[0], files?.og_image?.[0]);
  }

  @Patch(':id')
    @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'og_image', maxCount: 1 },
  ], multerConfig))
  @ApiOperation({ summary: 'Update blog — featured + OG image files + data JSON in one request' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'New featured image (optional)' },
        og_image: { type: 'string', format: 'binary', description: 'New OG image (optional)' },
        data: {
          type: 'string',
          description: 'JSON string of fields to update',
          example: '{"title":"Updated","status":"published"}',
        },
      },
    },
  })
  async updateBlog(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { file?: Express.Multer.File[]; og_image?: Express.Multer.File[] },
    @Body('data') data: string,
  ) {
    const parsedData = data ? JSON.parse(data) : {};
    const dto = plainToInstance(UpdateBlogDto, parsedData);
    await validateOrReject(dto);
    return this.svc.updateBlog(id, dto, files?.file?.[0], files?.og_image?.[0]);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete blog' })
  deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteBlog(id);
  }

  @Post(':id/status')
    @ApiOperation({ summary: 'Change blog status (publishing state machine)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status:     { type: 'string', enum: [...BLOG_STATUSES] },
        publish_at: { type: 'string', format: 'date-time', description: 'Required when status=scheduled' },
      },
    },
  })
  changeBlogStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeBlogStatusDto,
  ) {
    const { status, publish_at: publishAt } = dto;

    return this.svc.changeBlogStatus(id, status, publishAt);
  }

  @Post(':id/featured')
    @ApiOperation({ summary: 'Toggle blog featured status' })
  toggleBlogFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleBlogFeaturedDto,
  ) {
    return this.svc.toggleBlogFeatured(id, dto.featured);
  }

  @Post(':id/seo')
    @ApiOperation({ summary: 'Upsert SEO metadata for a blog post' })
  upsertBlogSeo(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertBlogSeoDto) {
    return this.svc.upsertBlogSeo(id, dto);
  }
}
