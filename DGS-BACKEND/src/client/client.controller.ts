import {
  Controller,
  Get,
  Post,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../upload/multer.config';
import { Public } from '../auth/decorators/public.decorator';
import { HeroService } from '../hero/hero.service';
import { BlogsService } from '../blogs/blogs.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { SettingsService } from '../settings/settings.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { PartnersService } from '../partners/partners.service';
import { CareersService } from '../careers/careers.service';
import { PublicCertificateQueryDto } from '../settings/dto/public-certificate-query.dto';
import { ClientLogosService } from '../client-logos/client-logos.service';
import { PricingService } from '../pricing/pricing.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';

@Controller('client')
@Public()
export class ClientController {
  constructor(
    private readonly heroService: HeroService,
    private readonly blogsService: BlogsService,
    private readonly settingsService: SettingsService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly portfolioService: PortfolioService,
    private readonly testimonialsService: TestimonialsService,
    private readonly partnersService: PartnersService,
    private readonly careersService: CareersService,
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
    const [blogs, portfolio] = await Promise.all([
      this.blogsService.findPublishedSlugs(),
      this.portfolioService.findPublicSlugs(),
    ]);

    return { blogs, portfolio };
  }

  @Get('config')
  @Public()
  async getConfig() {
    const [companySettings, siteSettings] = await Promise.all([
      this.settingsService.getCompanySettings().catch(() => ({})),
      this.siteSettingsService.getAllSettings().catch(() => ({})),
    ]);
    return {
      ...(companySettings || {}),
      ...(siteSettings || {}),
    };
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
  async getPortfolio(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('projectType') projectType?: string,
  ) {
    return this.portfolioService.findAllPublic(
      category,
      search,
      featured === 'true',
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      status,
      projectType,
    );
  }

  @Get('portfolio/locations')
  @Public()
  async getPortfolioLocations() {
    return this.portfolioService.getLocations();
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
  async getTestimonials(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('type') type?: string,
  ) {
    return this.testimonialsService.findApproved(Number(page), Number(limit), type);
  }

  @Get('testimonials/featured')
  @Public()
  async getFeaturedTestimonials() {
    return this.testimonialsService.findFeatured();
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



  @Get('office-hubs')
  @Public()
  async getOfficeHubs() {
    return this.settingsService.findAllOfficeHubsPublic();
  }

  /**
   * Public certificate feed (spec §4).
   *
   * `?featured=true` serves the landing strip (the page caps the render at 8),
   * `?limit`/`?offset` drive the certificates page's incremental loading, and
   * `?search` covers the site-wide search box. `hasMore` is returned so the
   * client does not have to infer the end of the set from `data.length`.
   */
  @Get('certificates')
  @Public()
  async getCertificates(@Query() query: PublicCertificateQueryDto) {
    return this.settingsService.findAllCertificatesPublic(query);
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