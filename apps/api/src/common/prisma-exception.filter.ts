import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[])?.join(', ') ?? 'unknown';
        message = `Un enregistrement avec ces valeurs existe déjà (${fields})`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Enregistrement introuvable';
        break;
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Référence invalide — l\'enregistrement lié n\'existe pas';
        break;
      }
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Erreur de base de données';
    }

    this.logger.warn(
      `[Prisma ${exception.code}] ${request.method} ${request.url} → ${status}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      code: `PRISMA_${exception.code}`,
    });
  }
}
