import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  ReorderModulesDto,
  UpdateProgressDto,
} from './dto/course.dto';
import type { Course, CourseModule, CourseEnrollment, Prisma } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Psychologist routes ────────────────────────────────────────────────────

  async create(
    userId: string,
    dto: CreateCourseDto,
    actorId: string,
    req?: Request,
  ): Promise<Course> {
    const psy = await this.getPsychologist(userId);

    const course = await this.prisma.course.create({
      data: {
        psychologistId: psy.id,
        title: dto.title,
        description: dto.description,
        price: dto.price,
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'course',
      entityId: course.id,
      req,
    });

    return course;
  }

  async findAll(
    userId: string,
    actorId: string,
    req?: Request,
  ): Promise<(Course & { _count: { enrollments: number } })[]> {
    const psy = await this.getPsychologist(userId);

    const courses = await this.prisma.course.findMany({
      where: { psychologistId: psy.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    await this.audit.logRead(actorId, 'psychologist', 'courses', 'list', req);

    return courses;
  }

  async findOne(
    userId: string,
    courseId: string,
    actorId: string,
    req?: Request,
  ): Promise<Course & { modules: CourseModule[]; enrollments: CourseEnrollment[] }> {
    const psy = await this.getPsychologist(userId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
      include: {
        modules: { orderBy: { order: 'asc' } },
        enrollments: { orderBy: { enrolledAt: 'desc' } },
      },
    });

    if (!course) throw new NotFoundException('Formation introuvable');

    await this.audit.logRead(actorId, 'psychologist', 'course', courseId, req);

    return course;
  }

  async update(
    userId: string,
    courseId: string,
    dto: UpdateCourseDto,
    actorId: string,
    req?: Request,
  ): Promise<Course> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Formation introuvable');

    const data: Prisma.CourseUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data,
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'course',
      entityId: courseId,
      metadata: { fields: Object.keys(dto) },
      req,
    });

    return updated;
  }

  async togglePublish(
    userId: string,
    courseId: string,
    actorId: string,
    req?: Request,
  ): Promise<Course> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('Formation introuvable');

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: !existing.isPublished },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'course',
      entityId: courseId,
      metadata: { isPublished: updated.isPublished },
      req,
    });

    return updated;
  }

  async remove(
    userId: string,
    courseId: string,
    actorId: string,
    req?: Request,
  ): Promise<void> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!existing) throw new NotFoundException('Formation introuvable');

    if (existing._count.enrollments > 0) {
      throw new BadRequestException(
        `Impossible de supprimer une formation avec ${existing._count.enrollments} inscription(s)`,
      );
    }

    await this.prisma.course.delete({ where: { id: courseId } });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'course',
      entityId: courseId,
      req,
    });
  }

  // ─── Module routes ──────────────────────────────────────────────────────────

  async addModule(
    userId: string,
    courseId: string,
    dto: CreateModuleDto,
    actorId: string,
    req?: Request,
  ): Promise<CourseModule> {
    const psy = await this.getPsychologist(userId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
    });
    if (!course) throw new NotFoundException('Formation introuvable');

    // Determine next order if not provided
    let order = dto.order;
    if (order === undefined) {
      const maxModule = await this.prisma.courseModule.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxModule ? maxModule.order + 1 : 0;
    }

    const module = await this.prisma.courseModule.create({
      data: {
        courseId,
        title: dto.title,
        videoUrl: dto.videoUrl ?? null,
        content: dto.content ?? null,
        order,
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'course_module',
      entityId: module.id,
      metadata: { courseId },
      req,
    });

    return module;
  }

  async updateModule(
    userId: string,
    courseId: string,
    moduleId: string,
    dto: UpdateModuleDto,
    actorId: string,
    req?: Request,
  ): Promise<CourseModule> {
    const psy = await this.getPsychologist(userId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
    });
    if (!course) throw new NotFoundException('Formation introuvable');

    const existing = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!existing) throw new NotFoundException('Module introuvable');

    const data: Prisma.CourseModuleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.order !== undefined) data.order = dto.order;

    const updated = await this.prisma.courseModule.update({
      where: { id: moduleId },
      data,
    });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'course_module',
      entityId: moduleId,
      metadata: { courseId, fields: Object.keys(dto) },
      req,
    });

    return updated;
  }

  async removeModule(
    userId: string,
    courseId: string,
    moduleId: string,
    actorId: string,
    req?: Request,
  ): Promise<void> {
    const psy = await this.getPsychologist(userId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
    });
    if (!course) throw new NotFoundException('Formation introuvable');

    const existing = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
    });
    if (!existing) throw new NotFoundException('Module introuvable');

    await this.prisma.courseModule.delete({ where: { id: moduleId } });

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'course_module',
      entityId: moduleId,
      metadata: { courseId },
      req,
    });
  }

  async reorderModules(
    userId: string,
    courseId: string,
    dto: ReorderModulesDto,
    actorId: string,
    req?: Request,
  ): Promise<CourseModule[]> {
    const psy = await this.getPsychologist(userId);

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, psychologistId: psy.id },
    });
    if (!course) throw new NotFoundException('Formation introuvable');

    // Validate all modules belong to this course
    const moduleIds = dto.order.map((item) => item.id);
    const existingModules = await this.prisma.courseModule.findMany({
      where: { id: { in: moduleIds }, courseId },
      select: { id: true },
    });

    if (existingModules.length !== moduleIds.length) {
      throw new BadRequestException('Certains modules n\'appartiennent pas à cette formation');
    }

    // Update all orders in a transaction
    await this.prisma.$transaction(
      dto.order.map((item) =>
        this.prisma.courseModule.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    await this.audit.log({
      actorId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'course_modules',
      entityId: courseId,
      metadata: { reorder: true },
      req,
    });

    return this.prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  // ─── Public routes ──────────────────────────────────────────────────────────

  async findPublished(): Promise<(Course & { psychologist: { name: string; slug: string; specialization: string | null }; _count: { modules: number; enrollments: number } })[]> {
    return this.prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        psychologist: {
          select: { name: true, slug: true, specialization: true },
        },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
  }

  async findOnePublished(courseId: string): Promise<Course & {
    psychologist: { name: string; slug: string; specialization: string | null; bio: string | null };
    modules: CourseModule[];
    _count: { enrollments: number };
  }> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      include: {
        psychologist: {
          select: { name: true, slug: true, specialization: true, bio: true },
        },
        modules: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) throw new NotFoundException('Formation introuvable ou non publiée');

    return course;
  }

  // ─── Enrollment routes ──────────────────────────────────────────────────────

  async enroll(
    courseId: string,
    userId: string,
    actorId: string,
    req?: Request,
  ): Promise<CourseEnrollment> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
    });
    if (!course) throw new NotFoundException('Formation introuvable ou non publiée');

    // Check if already enrolled
    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) {
      throw new ConflictException('Déjà inscrit à cette formation');
    }

    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        courseId,
        userId,
        progress: {},
      },
    });

    await this.audit.log({
      actorId,
      actorType: 'patient',
      action: 'CREATE',
      entityType: 'course_enrollment',
      entityId: enrollment.id,
      metadata: { courseId, userId },
      req,
    });

    return enrollment;
  }

  async updateProgress(
    courseId: string,
    userId: string,
    dto: UpdateProgressDto,
    actorId: string,
    req?: Request,
  ): Promise<CourseEnrollment> {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (!enrollment) throw new NotFoundException('Inscription introuvable');

    // Verify the module belongs to this course
    const module = await this.prisma.courseModule.findFirst({
      where: { id: dto.moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module introuvable dans cette formation');

    // Merge progress JSON
    const currentProgress = (enrollment.progress as Record<string, string | null>) ?? {};
    if (dto.completed) {
      currentProgress[dto.moduleId] = new Date().toISOString();
    } else {
      delete currentProgress[dto.moduleId];
    }

    const updated = await this.prisma.courseEnrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: { progress: currentProgress },
    });

    await this.audit.log({
      actorId,
      actorType: 'patient',
      action: 'UPDATE',
      entityType: 'course_enrollment',
      entityId: enrollment.id,
      metadata: { courseId, moduleId: dto.moduleId, completed: dto.completed },
      req,
    });

    return updated;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
