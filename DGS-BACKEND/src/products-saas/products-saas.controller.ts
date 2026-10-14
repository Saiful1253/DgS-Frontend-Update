import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsSaasService } from './products-saas.service';
import { CreateProductSaasDto } from './dto/product-saas.dto';
import { UpdateProductSaasDto } from './dto/update-product-saas.dto';
import { UpdateProductSeoDto } from './dto/update-product-seo.dto';
import { ProductSaasQueryDto } from './dto/product-saas-query.dto';

/**
 * Admin CRUD for SaaS products.
 *
 * Guarded by `@UseGuards(JwtAuthGuard)` so only authenticated admins reach it.
 * Roles are organisational labels only — every authenticated user has full
 * access, so no finer-grained gate is applied here.
 *
 * The public storefront is unaffected: it reads through `ClientController`
 * (`/client/products*`), not through these routes.
 */
@ApiTags('Products (SaaS)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('products-saas')
export class ProductsSaasController {
  constructor(private readonly productsSaasService: ProductsSaasService) {}

  @Get()
    @ApiOperation({ summary: 'List SaaS products (admin)' })
  async findAll(@Query() query: ProductSaasQueryDto) {
    return this.productsSaasService.findAll(query.industry, query.category, query.search);
  }

  @Get(':slug')
    @ApiOperation({ summary: 'Get one SaaS product by slug (admin)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsSaasService.findBySlug(slug);
  }

  @Post()
    @ApiOperation({ summary: 'Create a SaaS product' })
  async create(@Body() body: CreateProductSaasDto) {
    return this.productsSaasService.create(body);
  }

  @Post(':id/seo')
    @ApiOperation({ summary: 'Update product SEO metadata' })
  async updateSeo(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProductSeoDto) {
    return this.productsSaasService.update(id, {
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      keywords: body.keywords,
      canonical_url: body.canonical_url,
      custom_og_image: body.custom_og_image,
      no_index: body.no_index,
      no_follow: body.no_follow,
    });
  }

  @Put(':id')
    @ApiOperation({ summary: 'Update a SaaS product' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProductSaasDto) {
    return this.productsSaasService.update(id, body);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete a SaaS product' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsSaasService.remove(id);
  }
}
