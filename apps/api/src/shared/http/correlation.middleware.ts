import { randomUUID } from 'node:crypto';

import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { requestContext } from '../observability/request-context.js';

const HEADER = 'x-correlation-id';
const VALID_INCOMING = /^[A-Za-z0-9-]{8,64}$/;
const logger = new Logger('Http');

/**
 * Assigns every request a correlation ID (ADR-036), echoes it in the response,
 * marks responses non-cacheable, and writes one access-log line per request.
 * Logged paths exclude query strings.
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(HEADER);
  const correlationId = incoming && VALID_INCOMING.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('Cache-Control', 'no-store');

  const started = process.hrtime.bigint();
  requestContext.run({ correlationId }, () => {
    res.on('finish', () => {
      requestContext.run({ correlationId }, () => {
        logger.log({
          event: 'http.request',
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Number((process.hrtime.bigint() - started) / 1_000_000n),
        });
      });
    });
    next();
  });
}
