import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ApplicationError } from '../../../shared/errors/application-error.js';
import type {
  AccountStatusRequirement,
  AuthContext,
  SessionService,
} from '../application/session.service.js';
import { SESSION_SERVICE } from './tokens.js';

const ACCOUNT_STATUS_REQUIREMENT = 'identity:account-status-requirement';

/**
 * Lets a route accept any account status (e.g. logout must work even for a
 * suspended account). Default: ACTIVE or PENDING_VERIFICATION only.
 */
export const AllowAnyAccountStatus = () =>
  SetMetadata(ACCOUNT_STATUS_REQUIREMENT, 'any' satisfies AccountStatusRequirement);

interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}

const BEARER = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/;

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = BEARER.exec(request.header('authorization') ?? '');
    const token = match?.[1];
    if (token === undefined) throw new ApplicationError('AUTH_REQUIRED');

    const requirement =
      this.reflector.getAllAndOverride<AccountStatusRequirement | undefined>(
        ACCOUNT_STATUS_REQUIREMENT,
        [context.getHandler(), context.getClass()],
      ) ?? 'self_service';
    request.auth = await this.sessions.authenticate(token, requirement);
    return true;
  }
}

/** The authenticated actor. Identity always comes from the server session. */
export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const auth = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  if (auth === undefined) throw new ApplicationError('AUTH_REQUIRED');
  return auth;
});
