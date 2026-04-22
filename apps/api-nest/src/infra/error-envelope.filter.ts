import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ZodError } from 'zod';

/**
 * Consistent error envelope for every API response:
 *   { error: { code, message, details? } }
 * Maps Zod errors to 400 with field-level details, HttpException to its
 * declared status, and everything else to 500 without leaking internals.
 */
@Catch()
export class ErrorEnvelopeFilter implements ExceptionFilter {
  private readonly log = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'internal_error';
    let message = 'Something went wrong';
    let details: unknown;

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'validation_failed';
      message = 'Request validation failed';
      details = exception.flatten();
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') message = r;
      else if (r && typeof r === 'object') {
        const obj = r as Record<string, unknown>;
        message = (obj.message as string) ?? message;
        code = (obj.code as string) ?? statusToCode(status);
        details = obj.details;
      }
      if (code === 'internal_error') code = statusToCode(status);
    } else if (exception && typeof exception === 'object' && 'status' in exception) {
      status = Number((exception as { status?: number }).status) || 500;
      code = statusToCode(status);
      message = String((exception as { message?: unknown }).message ?? message);
    } else {
      this.log.error(`unhandled: ${(exception as Error)?.stack ?? exception}`);
    }

    res.status(status).json({
      error: { code, message, ...(details ? { details } : {}) },
      requestId: req?.id ?? undefined,
    });
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400: return 'bad_request';
    case 401: return 'unauthorized';
    case 403: return 'forbidden';
    case 404: return 'not_found';
    case 409: return 'conflict';
    case 422: return 'unprocessable';
    case 429: return 'rate_limited';
    default: return status >= 500 ? 'internal_error' : 'error';
  }
}
