import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Generic Zod validation pipe. Use as `@Body(new ZodPipe(MySchema))`.
 * The ErrorEnvelopeFilter formats ZodError into the standard envelope.
 */
@Injectable()
export class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) throw result.error;
    return result.data;
  }
}
