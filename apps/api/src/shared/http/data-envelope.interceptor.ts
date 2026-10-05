import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

/**
 * Wraps controller results in the `{ data }` success envelope. `undefined`
 * (204 responses) passes through without a body.
 */
@Injectable()
export class DataEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(map((value) => (value === undefined ? undefined : { data: value })));
  }
}
