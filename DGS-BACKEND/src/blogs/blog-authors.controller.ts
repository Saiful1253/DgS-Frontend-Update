import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogAuthorDto } from './dto/create-blog-author.dto';
import { UpdateBlogAuthorDto } from './dto/update-blog-author.dto';
import { multerConfig } from '../upload/multer.config';

@ApiTags('Blog Authors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('blog-authors')
export class BlogAuthorsController {
  constructor(private svc: BlogsService) {}

  @Get()
    @ApiOperation({ summary: 'List blog authors with search and exclusion filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'exclude_names', required: false, description: 'Comma-separated names to exclude' })
  @ApiQuery({ name: 'exclude_ids', required: false, description: 'Comma-separated IDs to exclude' })
  findAllAuthors(
    @Query('search') search?: string,
    @Query('exclude_names') excludeNames?: string,
    @Query('exclude_ids') excludeIds?: string,
  ) {
    const names = excludeNames ? excludeNames.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const ids = excludeIds ? excludeIds.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)) : undefined;
    return this.svc.findAllAuthors(search, names, ids);
  }

  @Post()
    @ApiOperation({ summary: 'Create blog author' })
  createAuthor(@Body() dto: CreateBlogAuthorDto) { return this.svc.createAuthor(dto); }

  @Patch(':id')
    @ApiOperation({ summary: 'Update blog author' })
  updateAuthor(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogAuthorDto) {
    return this.svc.updateAuthor(id, dto);
  }

  @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload blog author avatar' })
  uploadAuthorAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.uploadAuthorAvatar(id, file);
  }

  @Delete(':id/avatar')
    @ApiOperation({ summary: 'Delete blog author avatar' })
  deleteAuthorAvatar(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteAuthorAvatar(id);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete blog author' })
  deleteAuthor(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteAuthor(id);
  }
}
