import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientLogo } from './client-logo.entity';
import { ClientLogosService } from './client-logos.service';
import { ClientLogosController } from './client-logos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientLogo])],
  controllers: [ClientLogosController],
  providers: [ClientLogosService],
  exports: [ClientLogosService],
})
export class ClientLogosModule {}