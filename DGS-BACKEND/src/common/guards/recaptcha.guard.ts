import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5;

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY', '');
    if (!secret) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.body?.recaptchaToken;

    if (!token) {
      throw new BadRequestException('reCAPTCHA token required');
    }

    const { data } = await axios.post(
      RECAPTCHA_VERIFY_URL,
      null,
      { params: { secret, response: token } },
    );

    if (!data.success) {
      throw new BadRequestException('reCAPTCHA verification failed');
    }

    if (typeof data.score === 'number' && data.score < MIN_SCORE) {
      throw new BadRequestException('reCAPTCHA verification score too low');
    }

    return true;
  }
}