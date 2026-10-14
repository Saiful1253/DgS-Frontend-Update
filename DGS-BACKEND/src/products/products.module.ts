import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductBrand } from './entities/product-brand.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductCategoryAttribute } from './entities/product-category-attribute.entity';
import { SeoMeta } from '../seo/entities/seo-meta.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductBrand,
      ProductCategory,
      ProductCategoryAttribute,
      // Product SEO rows in the shared seo_meta table.
      SeoMeta,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  // `ClientModule` injects `ProductsService` for the public `/client/products*`
  // routes. A provider that is not exported stays private to its own module.
  exports: [ProductsService],
})
export class ProductsModule {}
