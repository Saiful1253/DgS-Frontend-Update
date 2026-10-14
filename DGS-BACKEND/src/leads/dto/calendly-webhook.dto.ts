import { Allow, IsOptional, IsString } from 'class-validator';

/**
 * Calendly webhook envelope. Fields are declared with @Allow() because the
 * payload is produced by a third party: it must survive `whitelist: true`
 * without type constraints that could reject a legitimate Calendly variant.
 *
 * `payload` is the inner event object. The service reads
 * `payload.payload || payload`, so this property MUST stay declared or lead
 * matching by email silently breaks.
 */
export class CalendlyWebhookDto {
  @IsOptional()
  @Allow()
  payload?: Record<string, any>;

  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() event_uri?: string;
  @IsOptional() @IsString() uri?: string;
  @IsOptional() @IsString() event?: string;
  @IsOptional() @IsString() start_time?: string;
  @IsOptional() @Allow() variables?: Record<string, any>;
  @IsOptional() @Allow() questions_and_answers?: any;
}
