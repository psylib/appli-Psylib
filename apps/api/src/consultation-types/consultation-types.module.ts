import { Module } from '@nestjs/common';
import { ConsultationTypesController } from './consultation-types.controller';
import { ConsultationTypesService } from './consultation-types.service';

@Module({
  controllers: [ConsultationTypesController],
  providers: [ConsultationTypesService],
  exports: [ConsultationTypesService],
})
export class ConsultationTypesModule {}
