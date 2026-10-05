import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';

const RAW_RESPONSE = 'http:raw-response';

/**
 * Opts a controller or route out of the `{ data }` envelope. For operational
 * endpoints outside the consumer API (e.g. `/health`), whose response shapes
 * are fixed contracts of their own.
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE, true);

/**
 * Wraps controller results in the `{ data }` success envelope. `undefined`
 * (204 responses) passes through without a body.
 */
@Injectable()
export class DataEnvelopeInterceptor implements NestInterceptor {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const raw = this.reflector.getAllAndOverride<boolean | undefined>(RAW_RESPONSE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (raw === true) return next.handle();
    return next.handle().pipe(map((value) => (value === undefined ? undefined : { data: value })));
  }
}
