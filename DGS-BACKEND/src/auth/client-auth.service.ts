import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { ClientRegisterDto } from './dto/client-register.dto';
import { ClientResetRequestDto, ClientResetVerifyDto, ClientResetSubmitDto } from './dto/client-reset.dto';
import { ClientUpdateProfileDto } from './dto/client-update-profile.dto';
import { ClientChangePasswordDto } from './dto/client-change-password.dto';
import { CloudinaryService } from '../upload/cloudinary.service';
import { NotificationService } from '../notification/notification.service';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class ClientAuthService {
  private readonly logger = new Logger(ClientAuthService.name);
  private resetOtps = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
    private cloudinaryService: CloudinaryService,
    private notificationService: NotificationService,
    private leadsService: LeadsService,
  ) {}

  async register(dto: ClientRegisterDto, file?: Express.Multer.File) {
    const emailLower = dto.email ? dto.email.toLowerCase() : null;

    const existingUser = await this.userRepo.findOne({
      where: emailLower
        ? [{ email: emailLower, is_deleted: false }]
        : { is_deleted: false },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const newUser = this.userRepo.create({
      name: dto.name,
      email: emailLower,
      mobile_number: dto.mobile_number,
      password: dto.password,
    });

    await this.userRepo.save(newUser);
    return this.login({ email: dto.email, password: dto.password });
  }

  async login(dto: any) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), is_deleted: false },
    });

    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: '30d',
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, name: user.name, mobile_number: user.mobile_number };
  }

  async updateProfile(userId: number, dto: ClientUpdateProfileDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email.toLowerCase(), is_deleted: false },
      });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email already in use.');
      }
      user.email = dto.email.toLowerCase();
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.mobile_number !== undefined) user.mobile_number = dto.mobile_number;

    await this.userRepo.save(user);
    return this.getProfile(user.id);
  }

  async changePassword(userId: number, dto: ClientChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId, is_deleted: false },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!(await user.validatePassword(dto.currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = dto.newPassword;
    await this.userRepo.save(user);
    return { message: 'Password changed successfully' };
  }

  async getMyProjects(email: string) {
    const leads = await this.leadsService.findByClientEmail(email);
    return leads.map((l) => ({
      id: l.id,
      type: l.type,
      status: l.status,
      full_name: l.full_name,
      company_name: l.company_name,
      service_requirements: l.service_requirements,
      created_at: l.created_at,
      trial_assets: l.trial_assets || [],
      consultations: (l.consultations || []).sort(
        (a, b) => new Date(b.scheduled_at || 0).getTime() - new Date(a.scheduled_at || 0).getTime(),
      ),
    }));
  }

  async getMyConsultations(email: string) {
    const leads = await this.leadsService.findByClientEmail(email);
    const consultations = leads.flatMap((l) =>
      (l.consultations || []).map((c) => ({
        id: c.id,
        lead_id: l.id,
        project: l.full_name || l.company_name || `Lead #${l.id}`,
        scheduled_at: c.scheduled_at,
        timezone: c.timezone,
        meeting_status: c.meeting_status,
        meeting_link: c.meeting_link,
      })),
    );
    return consultations.sort(
      (a, b) => new Date(b.scheduled_at || 0).getTime() - new Date(a.scheduled_at || 0).getTime(),
    );
  }
}
