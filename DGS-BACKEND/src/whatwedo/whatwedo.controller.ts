import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Query,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWhatWeDoDto } from './dto/create-what-we-do.dto';
import { ListWhatWeDoDto } from './dto/list-what-we-do.dto';
import { ReorderWhatWeDoDto } from './dto/reorder-what-we-do.dto';
import { UpdateWhatWeDoDto } from './dto/update-what-we-do.dto';
import { WhatWeDoService } from './whatwedo.service';

@ApiTags("What We Do")
@Controller("what-we-do")
export class WhatWeDoController {
  constructor(private readonly service: WhatWeDoService) {}

  @Get()
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get paginated What We Do rows for administration" })
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: ListWhatWeDoDto,
  ) {
    return this.service.findAll(query);
  }

  @Get("public")
  @Public()
  @ApiOperation({
    summary: "Get available What We Do rows for the public site",
  })
  findAllPublic() {
    return this.service.findAllPublic();
  }

  @Get("categories")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List Of categories" })
  findCategories(): Promise<{ category: string }[]> {
    return this.service.categories();
  }

  @Get(":id")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get a What We Do row by ID" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post("create")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a What We Do row (multiple input)" })
  create(
    @Body(
      new ParseArrayPipe({
        items: CreateWhatWeDoDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dtos: CreateWhatWeDoDto[],
  ) {
    return this.service.create(dtos);
  }

  @Post("reorder")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Reorder What We Do rows within a category" })
  reorder(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ReorderWhatWeDoDto,
  ) {
    return this.service.reorder(dto);
  }

  @Patch(":id")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update a What We Do row" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: UpdateWhatWeDoDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Soft-delete a What We Do row" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
