import { Injectable, BadRequestException, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { SanitizationService } from './sanitization.service';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  constructor(private readonly sanitizationService: SanitizationService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    // Sanitize the input
    const sanitized = this.sanitizationService.sanitizeJson(value);

    // Validate using class-validator
    if (metadata.type === 'body' && metadata.metatype) {
      const object = plainToClass(metadata.metatype, sanitized);
      const errors = await validate(object);

      if (errors.length > 0) {
        throw new BadRequestException(
          errors.map(e => ({
            field: e.property,
            errors: Object.values(e.constraints || {}),
          })),
        );
      }
    }

    return sanitized;
  }
}
