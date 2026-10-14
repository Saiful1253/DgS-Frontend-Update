import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Header } from '@nestjs/common';
import { SeoService } from './seo.service';
import { UpsertPageMetaDto } from './dto/seo-metadata.dto';
import { CreateRedirectRuleDto } from './dto/redirect-rule.dto';
import { UpdateRedirectRuleDto } from './dto/update-redirect-rule.dto';
import { UpdateSitemapConfigDto } from './dto/sitemap-config.dto';
import { RedirectLookupQueryDto } from './dto/redirect-lookup-query.dto';

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  // Page Meta, Open Graph, Schema & Canonical API
  @Get('page')
  async getPageMeta(@Query('path') path?: string) {
    return this.seoService.getPageMeta(path || '/');
  }

  @Get('meta')
  async findAllMeta() {
    return this.seoService.findAllMeta();
  }

  @Post('meta')
  async upsertPageMeta(@Body() body: UpsertPageMetaDto) {
    return this.seoService.upsertPageMeta(body);
  }

  // Redirect Management API
  @Get('redirects')
  async findAllRedirects() {
    return this.seoService.findAllRedirects();
  }

  @Get('redirects/lookup')
  async findActiveRedirect(@Query() query: RedirectLookupQueryDto) {
    return this.seoService.findActiveRedirect(query.path);
  }

  @Post('redirects')
  async createRedirect(@Body() body: CreateRedirectRuleDto) {
    return this.seoService.createRedirect(body);
  }

  @Put('redirects/:id')
  async updateRedirect(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateRedirectRuleDto) {
    return this.seoService.updateRedirect(id, body);
  }

  @Delete('redirects/:id')
  async removeRedirect(@Param('id', ParseIntPipe) id: number) {
    return this.seoService.removeRedirect(id);
  }

  // Sitemap & Robots.txt API
  @Get('sitemap-config')
  async getSitemapConfig() {
    return this.seoService.getSitemapConfig();
  }

  @Put('sitemap-config')
  async updateSitemapConfig(@Body() body: UpdateSitemapConfigDto) {
    return this.seoService.updateSitemapConfig(body);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  async generateRobotsTxt() {
    return this.seoService.generateRobotsTxt();
  }
}
