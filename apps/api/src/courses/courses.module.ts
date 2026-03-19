import { Module } from '@nestjs/common';
import { CoursesController, CoursesPublicController, CoursesEnrollmentController } from './courses.controller';
import { CoursesService } from './courses.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [CoursesController, CoursesPublicController, CoursesEnrollmentController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
