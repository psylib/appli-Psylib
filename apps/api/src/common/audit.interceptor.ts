import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditService } from './audit.service';

export interface AuditableRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

/**
 * AuditInterceptor — Journalisation automatique HDS
 *
 * Utilisation :
 * @UseInterceptors(AuditInterceptor)
 * sur les controllers/routes manipulant des données patients sensibles.
 *
 * Log READ sur GET, CREATE sur POST, UPDATE sur PUT/PATCH, DELETE sur DELETE.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuditableRequest>();
    const method = req.method;
    const user = req.user;

    const actionMap: Record<string, 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = actionMap[method];

    return next.handle().pipe(
      tap(() => {
        if (!user || !action) return;

        const entityId = (req.params['id'] as string | undefined) ?? 'unknown';
        const entityType = this.extractEntityType(req.path);
        const actorType = user.role === 'psychologist' ? 'psychologist' : 'patient';

        void this.auditService.log({
          actorId: user.sub,
          actorType,
          action,
          entityType,
          entityId,
          req,
        });
      }),
    );
  }

  private extractEntityType(path: string): string {
    const segments = path.split('/').filter(Boolean);
    // Extrait le segment de ressource (ex: "patients" depuis "/api/v1/patients/123")
    for (const segment of segments) {
      if (!['api', 'v1'].includes(segment) && !/^[0-9a-f-]{36}$/.test(segment)) {
        return segment;
      }
    }
    return 'unknown';
  }
}
