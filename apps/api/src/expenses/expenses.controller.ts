import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('multer'); // ensure Express.Multer global types are loaded
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequireFeature } from '../billing/decorators/require-plan.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@Controller('expenses')
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequireFeature('expenses')
  @UseGuards(SubscriptionGuard)
  create(
    @CurrentUser() user: KeycloakUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.sub, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: KeycloakUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
  ) {
    return this.expensesService.findAll(user.sub, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      category,
      dateFrom,
      dateTo,
      search,
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
  ) {
    return this.expensesService.findOne(user.sub, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
  ) {
    return this.expensesService.softDelete(user.sub, id);
  }

  @Post(':id/receipt')
  @RequireFeature('expenses')
  @UseGuards(SubscriptionGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadReceipt(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.expensesService.uploadReceipt(user.sub, id, file);
  }

  @Get(':id/receipt')
  getReceipt(
    @CurrentUser() user: KeycloakUser,
    @Param('id') id: string,
  ) {
    return this.expensesService.getReceiptUrl(user.sub, id);
  }
}
