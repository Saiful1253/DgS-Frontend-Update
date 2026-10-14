import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { Public } from '../auth/decorators/public.decorator';
import { RecaptchaGuard } from '../common/guards/recaptcha.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateFreeTrialDto } from './dto/create-free-trial.dto';
import { CalendlyWebhookDto } from './dto/calendly-webhook.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { AddLeadNoteDto } from './dto/add-lead-note.dto';
import { LeadsQueryDto, LeadExportQueryDto } from './dto/leads-query.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(@Query() query: LeadsQueryDto) {
    return this.leadsService.findAll(query.type, query.status, query.search);
  }

  @Get('export')
  async export(
    @Res({ passthrough: true }) res: Response,
    @Query() query: LeadExportQueryDto,
  ) {
    const { buffer, mime, ext } = await this.leadsService.export(
      query.type,
      query.status,
      query.search,
      query.format ?? 'xlsx',
    );
    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="leads-${Date.now()}.${ext}"`,
    );
    return new StreamableFile(buffer);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Post('inquiry')
  @Public()
  @UseGuards(RecaptchaGuard)
  async createInquiry(@Body() body: CreateLeadDto) {
    return this.leadsService.createInquiry(body);
  }

  @Post('free-trial')
  @Public()
  @UseGuards(RecaptchaGuard)
  async createFreeTrial(@Body() body: CreateFreeTrialDto) {
    return this.leadsService.createFreeTrial(body.lead, body.assets);
  }

  @Post('consultation/webhook')
  @Public()
  async consultationWebhook(@Body() body: CalendlyWebhookDto) {
    return this.leadsService.upsertConsultationFromCalendly(body);
  }

  @Patch(':id/assign')
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssignLeadDto,
  ) {
    return this.leadsService.assignLead(id, body.assigned_owner_id);
  }

  @Get(':id/trial-assets')
  async trialAssets(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findTrialAssets(id);
  }

  @Get(':id/trial-assets/download-zip')
  async downloadTrialAssetsZip(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename } = await this.leadsService.downloadTrialAssetsZip(id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(stream);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateLeadDto) {
    return this.leadsService.updateLead(id, body);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(id, body.status, body.adminUserId, body.notes);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddLeadNoteDto,
  ) {
    return this.leadsService.addNote(id, body.notes, body.adminUserId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.remove(id);
  }
}