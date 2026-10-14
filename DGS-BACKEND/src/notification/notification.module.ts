import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationTemplate,
  NotificationLog,
} from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationChannel,
      NotificationEvent,
      NotificationTemplate,
      NotificationLog,
    ]),
    ConfigModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
