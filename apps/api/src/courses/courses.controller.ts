import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  ReorderModulesDto,
  UpdateProgressDto,
} from './dto/course.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { PatientJwtGuard } from '../patient-portal/guards/patient-jwt.guard';
import { SubscriptionPlan } from '@psyscale/shared-types';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import type { PatientUser } from '../patient-portal/strategies/patient-jwt.strategy';

// ─── Psychologist routes ──────────────────────────────────────────────────────

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ── CRUD courses ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Créer une formation (plan PRO requis)' })
  @ApiResponse({ status: 201, description: 'Formation créée' })
  create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.create(user.sub, dto, user.sub, req);
  }

  @Get()
  @ApiOperation({ summary: 'Liste ses formations avec count inscrits' })
  findAll(
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.findAll(user.sub, user.sub, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail formation + modules + enrollments' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.findOne(user.sub, id, user.sub, req);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier titre/description/prix' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.update(user.sub, id, dto, user.sub, req);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publier/dépublier une formation (toggle)' })
  togglePublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.togglePublish(user.sub, id, user.sub, req);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une formation (si 0 enrollments)' })
  @ApiResponse({ status: 204, description: 'Formation supprimée' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    await this.coursesService.remove(user.sub, id, user.sub, req);
  }

  // ── Module sub-routes ───────────────────────────────────────────────────────

  @Post(':id/modules')
  @ApiOperation({ summary: 'Ajouter un module à la formation' })
  @ApiResponse({ status: 201, description: 'Module créé' })
  addModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateModuleDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.addModule(user.sub, id, dto, user.sub, req);
  }

  @Put(':id/modules/:moduleId')
  @ApiOperation({ summary: 'Modifier un module' })
  updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.updateModule(user.sub, id, moduleId, dto, user.sub, req);
  }

  @Delete(':id/modules/:moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un module' })
  @ApiResponse({ status: 204, description: 'Module supprimé' })
  async removeModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    await this.coursesService.removeModule(user.sub, id, moduleId, user.sub, req);
  }

  @Patch(':id/modules/reorder')
  @ApiOperation({ summary: 'Réordonner les modules' })
  reorderModules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderModulesDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.coursesService.reorderModules(user.sub, id, dto, user.sub, req);
  }
}

// ─── Public routes controller (no auth required) ─────────────────────────────

@ApiTags('Courses - Public')
@Controller('courses/public')
export class CoursesPublicController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des formations publiées (publique)' })
  findPublished() {
    return this.coursesService.findPublished();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une formation publiée (publique)' })
  findOnePublished(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOnePublished(id);
  }
}

// ─── Enrollment routes controller (patient-jwt) ──────────────────────────────

interface RequestWithPatient extends Request {
  user?: PatientUser;
}

@ApiTags('Courses - Enrollment')
@Controller('courses')
export class CoursesEnrollmentController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post(':id/enroll')
  @UseGuards(PatientJwtGuard)
  @ApiOperation({ summary: 'S\'inscrire à une formation (auth patient)' })
  @ApiResponse({ status: 201, description: 'Inscription créée' })
  enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithPatient,
  ) {
    const user = req.user as PatientUser;
    // sub = userId for patient JWT
    return this.coursesService.enroll(id, user.sub, user.sub, req as Request);
  }

  @Patch(':id/progress')
  @UseGuards(PatientJwtGuard)
  @ApiOperation({ summary: 'Mettre à jour la progression d\'un module' })
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
    @Req() req: RequestWithPatient,
  ) {
    const user = req.user as PatientUser;
    return this.coursesService.updateProgress(id, user.sub, dto, user.sub, req as Request);
  }
}
