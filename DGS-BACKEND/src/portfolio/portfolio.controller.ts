import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioQueryDto } from './dto/portfolio-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  CreatePortfolioCategoryDto,
  UpdatePortfolioCategoryDto,
} from './dto/portfolio-category.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  /**
   * Public listing for the client panel. Declared before the `@Get(':slug')`
   * route so a request for `public` is not captured as a slug lookup.
   *
   * `search` and `category` are optional and both feed an ILIKE clause in the
   * service, so they stay bound parameters rather than being interpolated.
   */
  @Get('public')
  @Public()
  @ApiOperation({ summary: 'List published portfolio projects for the client panel' })
  async findAllPublic(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    return this.portfolioService.findAllPublic(
      category,
      search,
      featured === 'true',
    );
  }

  /** Public single-project read for the `/portfolio/[slug]` case study page. */
  @Get('public/:slug')
  @Public()
  @ApiOperation({ summary: 'Get one published portfolio project by slug' })
  async findOnePublic(@Param('slug') slug: string) {
    return this.portfolioService.findOnePublic(slug);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List all portfolio projects' })
  async findAll(@Query() query: PortfolioQueryDto) {
    return this.portfolioService.findAll(
      query.category,
      query.search,
      query.featured === 'true',
      query.page,
      query.limit,
    );
  }

  @Get('categories')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List all portfolio categories (paginated, newest first)' })
  async findAllCategories(
    @Query() query: PaginationQueryDto,
  ) {
    return this.portfolioService.findAllCategories(
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Post('categories')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create new portfolio category' })
  async createCategory(@Body() body: CreatePortfolioCategoryDto) {
    return this.portfolioService.createCategory(body.name);
  }

  @Put('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update portfolio category' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePortfolioCategoryDto,
  ) {
    return this.portfolioService.updateCategory(id, body.name);
  }

  @Delete('categories/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete portfolio category' })
  async removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.portfolioService.deleteCategory(id);
  }

  @Get(':slug')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get portfolio project by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.portfolioService.findBySlug(slug);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create new portfolio case study' })
  async create(@Body() body: CreatePortfolioDto) {
    return this.portfolioService.create(body);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update existing portfolio case study' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePortfolioDto) {
    return this.portfolioService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete portfolio project' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.portfolioService.remove(id);
  }
}
