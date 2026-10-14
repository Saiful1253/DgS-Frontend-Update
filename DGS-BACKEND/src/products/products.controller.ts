import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PartialType } from '@nestjs/swagger';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerConfig } from '../upload/multer.config';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductSeoDto,
  ToggleFeaturedDto,
  ProductQueryDto,
  CreateBrandDto,
  CreateCategoryDto,
  CreateCategoryAttributeDto,
} from './dto/product.dto';

const VIEW = 'products.saas.view';
const MANAGE = 'products.saas.manage';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Products ──────────────────────────────────────────────────────────────

  @Get()
    @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'ILIKE name/description' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'archived'],
  })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'created_at', 'base_price', 'updated_at'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOperation({ summary: 'List catalogue products (paged, with brand/category/images)' })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('filtered')
    @ApiOperation({ summary: 'List products for a category — used to derive spec templates' })
  async findFiltered(
    @Query('categoryId', ParseIntPipe) categoryId: number,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll({
      categoryId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('brands')
    @ApiOperation({ summary: 'List product brands' })
  async findAllBrands() {
    return this.productsService.findAllBrands();
  }

  @Post('brands')
    @ApiOperation({ summary: 'Create a brand' })
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.productsService.createBrand(dto);
  }

  @Post('brands/:id/logo')
    @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload/replace a brand logo' })
  async uploadBrandLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.productsService.uploadBrandLogo(id, file);
  }

  @Patch('brands/:id')
    @ApiOperation({ summary: 'Update a brand' })
  async updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBrandDto>,
  ) {
    return this.productsService.updateBrand(id, dto);
  }

  @Delete('brands/:id')
    @ApiOperation({ summary: 'Delete a brand' })
  async removeBrand(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeBrand(id);
  }

  @Get('categories')
    @ApiOperation({ summary: 'List product categories' })
  async findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('categories')
    @ApiOperation({ summary: 'Create a category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto);
  }

  @Patch('categories/:id')
    @ApiOperation({ summary: 'Update a category' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.productsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
    @ApiOperation({ summary: 'Delete a category' })
  async removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.removeCategory(id);
  }

  @Get('categories/:categoryId/attributes')
    @ApiOperation({ summary: 'List specification attribute definitions for a category' })
  async findCategoryAttributes(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.productsService.findCategoryAttributes(categoryId);
  }

  @Post('categories/:categoryId/attributes')
    @ApiOperation({ summary: 'Create a specification attribute definition' })
  async createCategoryAttribute(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: CreateCategoryAttributeDto,
  ) {
    return this.productsService.createCategoryAttribute(categoryId, dto);
  }

  @Delete('attributes/:attributeId')
    @ApiOperation({ summary: 'Delete a specification attribute definition' })
  async deleteCategoryAttribute(
    @Param('attributeId', ParseIntPipe) attributeId: number,
  ) {
    return this.productsService.deleteCategoryAttribute(attributeId);
  }

  @Get(':id')
    @ApiOperation({ summary: 'Get one product' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
    @ApiOperation({ summary: 'Create a product' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
    @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Delete a product' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Patch(':id/toggle-featured')
    @ApiOperation({ summary: 'Set a product featured flag' })
  async toggleFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleFeaturedDto,
  ) {
    return this.productsService.toggleFeatured(id, dto.is_featured);
  }

  @Patch(':id/seo')
    @ApiOperation({ summary: 'Update product SEO metadata' })
  async updateSeo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductSeoDto,
  ) {
    return this.productsService.updateSeo(id, dto);
  }

  @Post(':id/images')
    @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        // Index of the primary file inside this upload, as sent by the admin form.
        isPrimary: { type: 'integer', example: 0 },
      },
    },
  })
  @ApiOperation({ summary: 'Upload product gallery images' })
  async uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('isPrimary') isPrimary?: string,
  ) {
    const primaryIndex = isPrimary === undefined || isPrimary === '' ? undefined : Number(isPrimary);
    if (primaryIndex !== undefined && !Number.isInteger(primaryIndex)) {
      throw new BadRequestException('isPrimary must be an index into the uploaded files');
    }
    return this.productsService.addImages(id, files, primaryIndex);
  }

  @Delete(':id/images/:imageId')
    @ApiOperation({ summary: 'Delete a product gallery image' })
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productsService.deleteImage(id, imageId);
  }

  @Patch(':id/images/:imageId/primary')
    @ApiOperation({ summary: 'Promote a gallery image to primary' })
  async setPrimaryImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productsService.setPrimaryImage(id, imageId);
  }
}
