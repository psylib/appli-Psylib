import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientPortalModule } from '../patient-portal/patient-portal.module';
import { BillingModule } from '../billing/billing.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [PatientPortalModule, BillingModule, DocumentsModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
