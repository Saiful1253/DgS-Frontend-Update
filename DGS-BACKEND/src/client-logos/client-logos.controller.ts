import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ClientLogosService } from './client-logos.service';
import { CreateClientLogoDto } from './dto/client-logo.dto';
import { UpdateClientLogoDto } from './dto/update-client-logo.dto';
import { ReorderClientLogosDto } from './dto/reorder-client-logos.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('client-logos')
export class ClientLogosController {
  constructor(private readonly service: ClientLogosService) {}

  @Get()
  @Public()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateClientLogoDto) {
    return this.service.create(body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateClientLogoDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post('reorder')
  async reorder(@Body() body: ReorderClientLogosDto) {
    return this.service.reorder(body.order);
  }
}