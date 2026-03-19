import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const PREFIX = 'psylib:cache:';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST') ?? 'localhost',
      port: this.config.get<number>('REDIS_PORT') ?? 6379,
      password: this.config.get<string>('REDIS_PASSWORD') ?? undefined,
      enableReadyCheck: false,
      maxRetriesPerRequest: 0,
    });
    this.redis.on('error', (err) => this.logger.warn(`Redis cache error: ${String(err)}`));
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => {});
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(PREFIX + key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(PREFIX + key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // cache is non-critical — silently ignore write errors
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(PREFIX + key);
    } catch {
      // ignore
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(PREFIX + pattern);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch {
      // ignore
    }
  }
}
