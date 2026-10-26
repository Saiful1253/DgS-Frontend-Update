import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { multerConfig } from '../upload/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateCompanySettingsDto } from './dto/company-setting.dto';
import { CreateOfficeHubDto } from './dto/office-hub.dto';
import { UpdateOfficeHubDto } from './dto/update-office-hub.dto';
import { ReorderOfficeHubsDto } from './dto/reorder-office-hubs.dto';
import { CreateCertificateDto } from './dto/certificate.dto';
import { AdminCertificateQueryDto } from './dto/admin-certificate-query.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CreateComplianceDocumentDto } from './dto/compliance-document.dto';
import { UpdateComplianceDocumentDto } from './dto/update-compliance-document.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  // Company Overview Settings API
  @Get('company')
    async getCompanySettings() {
    return this.settingsService.getCompanySettings();
  }

  @Put('company')
    async updateCompanySettings(@Body() body: UpdateCompanySettingsDto) {
    return this.settingsService.updateCompanySettings(body);
  }

  @Post('company/logo')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload company logo → Cloudinary → stores URL in company_settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Company logo image' },
      },
    },
  })
  async uploadCompanyLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.settingsService.uploadCompanyLogo(file);
  }

  // Office Hubs API
  @Get('office-hubs')
  @Public()
  async findAllOfficeHubs() {
    return this.settingsService.findAllOfficeHubs();
  }

  @Post('office-hubs')
    async createOfficeHub(@Body() body: CreateOfficeHubDto) {
    return this.settingsService.createOfficeHub(body);
  }

  @Put('office-hubs/:id')
    async updateOfficeHub(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateOfficeHubDto) {
    return this.settingsService.updateOfficeHub(id, body);
  }

  @Delete('office-hubs/:id')
    async removeOfficeHub(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.removeOfficeHub(id);
  }

  @Post('office-hubs/reorder')
    async reorderOfficeHubs(@Body() body: ReorderOfficeHubsDto) {
    return this.settingsService.reorderOfficeHubs(body.order);
  }

  // Certificates API
  /**
   * Admin listing — paginated, searchable, sortable and filterable.
   *
   * The public storefront does not use this route; it reads `/client/certificates`,
   * which excludes inactive rows.
   */
  @Get('certificates')
  @Public()
  async findAllCertificates(@Query() query: AdminCertificateQueryDto) {
    return this.settingsService.findAllCertificates(query);
  }

  @Get('certificates/stats')
  @Public()
  async getCertificateStats() {
    return this.settingsService.getCertificateStats();
  }

  @Post('certificates/reorder')
  async reorderCertificates(@Body() body: { order: { id: number; display_order: number }[] }) {
    return this.settingsService.reorderCertificates(body.order);
  }

  @Post('certificates')
    async createCertificate(@Body() body: CreateCertificateDto) {
    return this.settingsService.createCertificate(body);
  }

  @Put('certificates/:id')
    async updateCertificate(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCertificateDto) {
    return this.settingsService.updateCertificate(id, body);
  }

  @Delete('certificates/:id')
    async removeCertificate(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.removeCertificate(id);
  }

  // Compliance Documents API
  @Get('compliance-docs')
  @Public()
  async findAllComplianceDocs() {
    return this.settingsService.findAllComplianceDocs();
  }

  @Post('compliance-docs')
    async createComplianceDoc(@Body() body: CreateComplianceDocumentDto) {
    return this.settingsService.createComplianceDoc(body);
  }

  @Put('compliance-docs/:id')
    async updateComplianceDoc(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateComplianceDocumentDto) {
    return this.settingsService.updateComplianceDoc(id, body);
  }

  @Delete('compliance-docs/:id')
    async removeComplianceDoc(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.removeComplianceDoc(id);
  }
}