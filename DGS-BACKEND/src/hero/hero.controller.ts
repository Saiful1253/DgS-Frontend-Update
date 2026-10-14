import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe, UseInterceptors,
  UploadedFile, UploadedFiles, BadRequestException
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { HeroService } from './hero.service';
import { CreateHeroSectionDto } from './dto/create-hero-section.dto';
import { UpdateHeroSectionDto } from './dto/update-hero-section.dto';
import { AddHeroMediaByUrlDto } from './dto/add-hero-media-by-url.dto';
import { UpdateHeroMediaDto } from './dto/update-hero-media.dto';
import { ReorderHeroMediaDto } from './dto/reorder-hero-media.dto';
import { multerConfig } from '../upload/multer.config';

@ApiTags('Hero')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('hero')
export class HeroController {
  constructor(private svc: HeroService) {}

  // ── Hero Sections ─────────────────────────────────────────────
  @Get()
    @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiOperation({ summary: 'Get all hero sections with media' })
  findHero(
    @Query('page')  page  = 1,
    @Query('limit') limit = 10,

  ) { return this.svc.findHero(+page, +limit,); }

  @Get(':id')
    @ApiOperation({ summary: 'Get hero section by ID with media' })
  findOneHero(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneHero(id);
  }

  @Post()
    @ApiOperation({ summary: 'Create hero section' })
  createHero(@Body() dto: CreateHeroSectionDto) { return this.svc.createHeroSection(dto); }

  @Patch(':id')
    @ApiOperation({ summary: 'Update hero section' })
  updateHero(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHeroSectionDto) {
    return this.svc.updateHeroSection(id, dto);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete hero section + all its media from Cloudinary' })
  deleteHero(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteHeroSection(id);
  }

  // ── Hero Media ────────────────────────────────────────────────
  @Get(':id/media')
    @ApiOperation({ summary: 'Get all media for a hero section' })
  getMedia(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getHeroMedia(id);
  }

  @Post(':id/media/upload')
    @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload single image → Cloudinary → save' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file:       { type: 'string', format: 'binary' },
        sort_order: { type: 'number', example: 0 },
        is_active:  { type: 'boolean', example: true },
      },
    },
  })
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('sort_order') sortOrder?: string,
    @Body('is_active')  isActive?:  string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.uploadHeroImage(id, file, {
      sort_order: sortOrder ? +sortOrder : undefined,
      is_active:  isActive === 'true',
    });
  }

  @Post(':id/media/upload-multiple')
    @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiOperation({ summary: 'Upload multiple images at once' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  uploadMultiple(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    return this.svc.uploadMultipleHeroImages(id, files);
  }

  @Post(':id/media/url')
    @ApiOperation({ summary: 'Add YouTube video or image by URL' })

  addMediaByUrl(@Param('id', ParseIntPipe) id: number, @Body() dto: AddHeroMediaByUrlDto) {
    return this.svc.addHeroMediaByUrl(id, dto);
  }

  @Patch(':id/media/:mediaId/replace')
    @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Replace existing media image with new file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  replaceImage(
    @Param('id',      ParseIntPipe) heroId:  number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.replaceHeroImage(mediaId, heroId, file);
  }

  @Patch('media/:id')
    @ApiOperation({ summary: 'Update media metadata (sort_order, is_active)' })
  updateMedia(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHeroMediaDto) {
    return this.svc.updateHeroMedia(id, dto);
  }

  @Patch(':id/media/reorder')
    @ApiOperation({ summary: 'Reorder media items' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        order: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:         { type: 'number', example: 1 },
              sort_order: { type: 'number', example: 0 },
            },
          },
        },
      },
    },
  })
  reorderMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderHeroMediaDto,
  ) {
    return this.svc.reorderHeroMedia(id, dto.order);
  }

  @Delete('media/:id')
    @ApiOperation({ summary: 'Delete media from DB + Cloudinary' })
  deleteMedia(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteHeroMedia(id);
  }
}
