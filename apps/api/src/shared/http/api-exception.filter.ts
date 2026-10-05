import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { ErrorCode, ErrorDetails, ErrorEnvelope } from '@project-connect/api-contracts';
import type { Response } from 'express';

import { ApplicationError, EphemeralStoreUnavailableError } from '../errors/application-error.js';
import { describeError } from '../observability/json-logger.js';
import { currentCorrelationId } from '../observability/request-context.js';
import { ERROR_PRESENTATION } from './error-mapping.js';

/**
 * Client errors raised by Express middleware (body-parser: malformed JSON,
 * payload too large) follow the http-errors convention: a 4xx `status` with
 * `expose: true`. They are the client's fault, never a server error.
 */
function isExposedClientError(exception: unknown): boolean {
  if (typeof exception !== 'object' || exception === null) return false;
  const status = 'status' in exception ? exception.status : undefined;
  const expose = 'expose' in exception ? exception.expose : undefined;
  return typeof status === 'number' && status >= 400 && status < 500 && expose === true;
}

function fromHttpException(exception: HttpException): ErrorCode {
  const status = exception.getStatus();
  if (status === 404) return 'NOT_FOUND';
  if (status >= 400 && status < 500) return 'VALIDATION_FAILED';
  return 'INTERNAL_ERROR';
}

/**
 * Maps every thrown value to the `{ error }` envelope. Unexpected errors are
 * logged without their messages and returned as INTERNAL_ERROR, so driver,
 * ORM and provider details never reach clients or logs.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let code: ErrorCode;
    let details: ErrorDetails | undefined;
    if (exception instanceof ApplicationError) {
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof EphemeralStoreUnavailableError) {
      code = 'SERVICE_UNAVAILABLE';
      this.logger.warn({ event: 'ephemeral_store.unavailable' });
    } else if (exception instanceof HttpException) {
      code = fromHttpException(exception);
    } else if (isExposedClientError(exception)) {
      code = 'VALIDATION_FAILED';
    } else {
      code = 'INTERNAL_ERROR';
      this.logger.error({ event: 'http.unhandled_error', ...describeError(exception) });
    }

    const presentation = ERROR_PRESENTATION[code];
    if (details?.retryAfterSeconds !== undefined) {
      response.setHeader('Retry-After', String(details.retryAfterSeconds));
    }
    const body: ErrorEnvelope = {
      error: {
        code,
        message: presentation.message,
        correlationId: currentCorrelationId() ?? 'unavailable',
        ...(details === undefined ? {} : { details }),
      },
    };
    response.status(presentation.status).json(body);
  }
}
