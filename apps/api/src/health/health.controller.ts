import { Controller, Get, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'net';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check — retourne ok/error sans exposer l\'infra' })
  async check(
    @Headers('x-internal-health-key') internalKey?: string,
  ): Promise<{ status: string; timestamp: string; db?: string; redis?: string }> {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const healthy = dbStatus === 'ok' && redisStatus === 'ok';

    if (!healthy) {
      throw new HttpException(
        { status: 'error', timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Détails infra uniquement pour les appels internes (monitoring interne)
    const configuredKey = this.config.get<string>('INTERNAL_HEALTH_KEY');
    if (configuredKey && internalKey === configuredKey) {
      return { status: 'ok', db: dbStatus, redis: redisStatus, timestamp: new Date().toISOString() };
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private checkRedis(): Promise<'ok' | 'error'> {
    return new Promise((resolve) => {
      const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
      const url = new URL(redisUrl);
      const host = url.hostname;
      const port = parseInt(url.port || '6379', 10);

      const socket = createConnection({ host, port, timeout: 3000 }, () => {
        socket.destroy();
        resolve('ok');
      });
      socket.on('error', () => resolve('error'));
      socket.on('timeout', () => { socket.destroy(); resolve('error'); });
    });
  }
}
