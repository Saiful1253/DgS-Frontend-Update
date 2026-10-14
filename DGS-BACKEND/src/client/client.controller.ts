import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HeroService } from '../hero/hero.service';
import { BlogsService } from '../blogs/blogs.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { SettingsService } from '../settings/settings.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { PartnersService } from '../partners/partners.service';
import { CareersService } from '../careers/careers.service';
import { ProductsService } from '../products/products.service';
import { ClientProductQueryDto } from '../products/dto/product.dto';
import { ClientLogosService } from '../client-logos/client-logos.service';
import { PricingService } from '../pricing/pricing.service';

@Controller('client')
@Public()
export class ClientController {
  constructor(
    private readonly heroService: HeroService,
    private readonly blogsService: BlogsService,
    private readonly settingsService: SettingsService,
    private readonly portfolioService: PortfolioService,
    private readonly testimonialsService: TestimonialsService,
    private readonly partnersService: PartnersService,
    private readonly careersService: CareersService,
    private readonly productsService: ProductsService,
    private readonly clientLogosService: ClientLogosService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Slug catalogue for the public sitemap.
   *
   * The client panel's `sitemap.ts` requested this route on every build, but no
   * such endpoint existed anywhere in the backend — it 404'd on every
   * regeneration, so products and blogs silently dropped out of the sitemap
   * and the only visible symptom was a 404 in the Nest log.
   *
   * Aggregates the three slug-list projections behind one call so a crawler
   * gets a single request instead of three. Each underlying query selects only
   * slug + updated_at.
   *
   * Products come from `ProductsService`, matching `/client/products/:slug`:
   * sourcing slugs from the SaaS catalogue while the detail route resolved
   * against `products` put URLs in the sitemap that 404'd on click.
   */
  @Get('sitemap-catalog')
  @Public()
  async getSitemapCatalog() {
    const [products, blogs, portfolio] = await Promise.all([
      this.productsService.findPublicSlugs(),
      this.blogsService.findPublishedSlugs(),
      this.portfolioService.findPublicSlugs(),
    ]);

    return { products, blogs, portfolio };
  }

  @Get('config')
  @Public()
  async getConfig() {
    return this.settingsService.getCompanySettings();
  }

  @Get('hero')
  @Public()
  async getHero() {
    return this.heroService.findActiveHero();
  }

  @Get('blogs')
  @Public()
  async getBlogs(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.blogsService.findPublishedBlogs(Number(page), Number(limit), search, category);
  }

  @Get('blogs/:id/related')
  @Public()
  async getRelatedBlogs(@Param('id') id: string, @Query('limit') limit = '3') {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return this.blogsService.findRelatedBlogs(0, Number(limit));
    }
    return this.blogsService.findRelatedBlogs(numericId, Number(limit));
  }

  @Get('blogs/:id')
  @Public()
  async getBlog(@Param('id') id: string) {
    const numericId = Number(id);
    const data = Number.isInteger(numericId) && numericId > 0
      ? await this.blogsService.findPublishedBlog(numericId)
      : await this.blogsService.findPublishedBlog(id);
    if (!data) throw new NotFoundException('Blog post not found');
    return data;
  }

  @Get('portfolio')
  @Public()
  async getPortfolio() {
    return this.portfolioService.findAll();
  }

  @Get('portfolio/categories')
  @Public()
  async getPortfolioCategories() {
    return this.portfolioService.findAllCategories();
  }

  @Get('portfolio/:slug')
  @Public()
  async getPortfolioBySlug(@Param('slug') slug: string) {
    const data = await this.portfolioService.findBySlug(slug);
    if (!data) throw new NotFoundException('Project not found');
    return data;
  }

  @Get('testimonials')
  @Public()
  async getTestimonials() {
    return this.testimonialsService.findAllPublic();
  }

  @Get('partners')
  @Public()
  async getPartners() {
    return this.partnersService.findAllPublic();
  }

  @Get('careers')
  @Public()
  async getCareers() {
    return this.careersService.findAllJobs(true);
  }

  @Get('technologies')
  @Public()
  async getTechnologies() {
    return this.settingsService.findAllTechnologies();
  }

  /**
   * Paged, filtered public catalogue.
   *
   * This previously delegated to `ProductsSaasService.findAllPublic()`, which
   * takes no arguments and returns the whole SaaS catalogue. So the storefront's
   * `page` / `limit` / `search` / `category` / `brand` / `sort` were silently
   * discarded, and the entity returned had none of the fields the product pages
   * read (`images`, `seo_meta`, `category`, `brand`, pricing) - they were
   * written against the `products` entity this route now serves.
   *
   * `ClientProductQueryDto` omits `status`, so only `active` rows are reachable;
   * `findAllPublic` pins it regardless.
   */
  @Get('products')
  @Public()
  async getProducts(@Query() query: ClientProductQueryDto) {
    return this.productsService.findAllPublic(query);
  }

  @Get('products/:slug')
  @Public()
  async getProduct(@Param('slug') slug: string) {
    // `findBySlug` throws NotFoundException itself, and scopes to
    // `status = 'active'` so an archived row is invisible, not merely hidden.
    return this.productsService.findBySlug(slug);
  }

  /**
   * Category and brand facets for the storefront filter rail.
   *
   * The client panel was calling `/client/categories` and `/client/brands`,
   * neither of which existed - the real routes live behind
   * `JwtAuthGuard` on `ProductsController`, so every request
   * 404'd and the service's never-throw wrapper turned that into a permanently
   * empty filter list.
   */
  @Get('categories')
  @Public()
  async getProductCategories() {
    return this.productsService.findAllCategories();
  }

  @Get('categories/:categoryId/attributes')
  @Public()
  async getProductCategoryAttributes(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productsService.findCategoryAttributes(categoryId);
  }

  /**
   * Spec facet values for a category.
   *
   * `attributes` returns only the slots ("Capacity", unit "GB"); a filter needs
   * the values too, and the storefront had no source for them.
   */
  @Get('categories/:categoryId/specs')
  @Public()
  async getProductCategorySpecs(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productsService.findCategorySpecValues(categoryId);
  }

  @Get('brands')
  @Public()
  async getProductBrands() {
    return this.productsService.findAllBrands();
  }

  @Get('office-hubs')
  @Public()
  async getOfficeHubs() {
    return this.settingsService.findAllOfficeHubsPublic();
  }

  @Get('certificates')
  @Public()
  async getCertificates() {
    return this.settingsService.findAllCertificatesPublic();
  }

  @Get('compliance-docs')
  @Public()
  async getComplianceDocs() {
    return this.settingsService.findAllComplianceDocsPublic();
  }

  @Get('client-logos')
  @Public()
  async getClientLogos() {
    return this.clientLogosService.findAllPublic();
  }

  @Get('pricing/:ownerType/:ownerId')
  @Public()
  async getPricing(
    @Param('ownerType') ownerType: string,
    @Param('ownerId') ownerId: string,
  ) {
    const numericId = Number(ownerId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException('Invalid owner id');
    }
    return this.pricingService.getBundle(ownerType, numericId);
  }
}