import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Validates and sanitizes slug parameters.
 * Slugs must be 1-200 chars, alphanumeric + hyphens only.
 */
@Injectable()
export class ParseSlugPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string' || value.length > 200 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(value)) {
      throw new BadRequestException('Slug invalide');
    }
    return value.toLowerCase();
  }
}

/**
 * Validates token parameters.
 * Tokens must be 1-500 chars, alphanumeric + hyphens + underscores + dots.
 */
@Injectable()
export class ParseTokenPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string' || value.length > 500 || !/^[a-zA-Z0-9_\-\.]+$/.test(value)) {
      throw new BadRequestException('Token invalide');
    }
    return value;
  }
}
