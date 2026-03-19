import { Module } from '@nestjs/common';
import { OutcomesController } from './outcomes.controller';
import { OutcomesService } from './outcomes.service';
import { ScoringService } from './scoring.service';

@Module({
  controllers: [OutcomesController],
  providers: [OutcomesService, ScoringService],
  exports: [OutcomesService],
})
export class OutcomesModule {}
