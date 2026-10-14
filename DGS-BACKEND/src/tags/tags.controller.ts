import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('Tags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('blog-tags')
export class TagsController {
  constructor(private svc: TagsService) {}

  @Get()
    @ApiOperation({ summary: 'List global tags with blog usage counts' })
  findAllTags() { return this.svc.findAllTags(); }

  @Post()
    @ApiOperation({ summary: 'Create global tag (idempotent by name)' })
  createTag(@Body() dto: CreateTagDto) { return this.svc.createTag(dto.name); }

  @Patch(':id')
    @ApiOperation({ summary: 'Rename a global tag' })
  updateTag(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.svc.updateTag(id, dto.name);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete global tag and unlink from all posts' })
  deleteTag(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteTag(id); }
}
