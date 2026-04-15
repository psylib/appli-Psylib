import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@Controller('recurring-expenses')
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
export class RecurringExpensesController {
  constructor(private readonly service: RecurringExpensesService) {}

  @Post()
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @UseGuards(SubscriptionGuard)
  create(
    @CurrentUser() user: KeycloakUser,
    @Body() dto: CreateRecurringExpenseDto,
  ) {
    return this.service.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: KeycloakUser) {
    return this.service.findAll(user.sub);
  }

  @Put(':id')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @UseGuards(SubscriptionGuard)
  update(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringExpenseDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Delete(':id')
  deactivate(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
  ) {
    return this.service.deactivate(user.sub, id);
  }
}
