import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SiteSettingsService } from './site-settings.service';
import { UpsertSiteSettingDto } from './dto/upsert-site-setting.dto';
import { multerConfig } from '../upload/multer.config';

@ApiTags('Site Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private svc: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all site settings as key-value map' })
  getAll() { return this.svc.getAllSettings(); }

  @Post()
    @ApiOperation({ summary: 'Bulk update settings' })
  bulkUpsert(@Body() body: Record<string, string>) { return this.svc.bulkUpsertSettings(body); }

  @Patch(':key')
    upsert(@Param('key') key: string, @Body() dto: UpsertSiteSettingDto) {
    return this.svc.upsertSetting(key, dto.value);
  }

  @Post('logo')
    @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload company logo → Cloudinary → stores URL in site_settings' })
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
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.uploadCompanyLogo(file);
  }
}
