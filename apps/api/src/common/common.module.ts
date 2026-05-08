import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EncryptionService } from './encryption.service';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { CacheService } from './cache.service';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [PrismaService, EncryptionService, AuditService, AuditInterceptor, CacheService, StorageService],
  exports: [PrismaService, EncryptionService, AuditService, AuditInterceptor, CacheService, StorageService],
})
export class CommonModule {}
