import { Body, Controller, Headers, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import {
  IDEMPOTENCY_KEY_HEADER,
  idempotencyKeySchema,
  logoutBodySchema,
  type OtpRequestResponse,
  otpRequestBodySchema,
  otpRequestResponseSchema,
  type OtpVerifyResponse,
  otpVerifyBodySchema,
  otpVerifyResponseSchema,
  type RefreshResponse,
  refreshBodySchema,
  refreshResponseSchema,
  type RegistrationResponse,
  registrationBodySchema,
  registrationResponseSchema,
} from '@project-connect/api-contracts';
import type { Request } from 'express';

import { ApplicationError } from '../../../shared/errors/application-error.js';
import { parseInput, shapeResponse } from '../../../shared/http/parse.js';
import type { OtpService } from '../application/otp.service.js';
import type { UserRecord } from '../application/ports.js';
import type { RegistrationService } from '../application/registration.service.js';
import type { AuthContext, IssuedSession, SessionService } from '../application/session.service.js';
import { AccessTokenGuard, AllowAnyAccountStatus, CurrentAuth } from './auth.guard.js';
import { OTP_SERVICE, REGISTRATION_SERVICE, SESSION_SERVICE } from './tokens.js';

const clientIp = (request: Request): string => request.ip ?? 'unknown';

function requireIdempotencyKey(value: string | undefined): string {
  const parsed = idempotencyKeySchema.safeParse(value);
  if (!parsed.success) throw new ApplicationError('IDEMPOTENCY_KEY_REQUIRED');
  return parsed.data;
}

const accountSummary = (account: UserRecord, session: IssuedSession) => ({
  userId: session.userId,
  accountStatus: account.accountStatus,
  onboardingStatus: account.onboardingStatus,
  onboardingStep: account.onboardingStep,
});

/**
 * `/api/v1/auth/*`. Thin transport layer: strict parsing, service call,
 * contract-checked response. Responses are `Cache-Control: no-store`
 * (correlation middleware).
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(OTP_SERVICE) private readonly otp: OtpService,
    @Inject(REGISTRATION_SERVICE) private readonly registration: RegistrationService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
  ) {}

  @Post('otp/request')
  @HttpCode(202)
  async requestOtp(@Body() body: unknown, @Req() request: Request): Promise<OtpRequestResponse> {
    const input = parseInput(otpRequestBodySchema, body);
    const result = await this.otp.request({
      phone: input.phone,
      installId: input.installId,
      ip: clientIp(request),
    });
    return shapeResponse(otpRequestResponseSchema, result);
  }

  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(
    @Body() body: unknown,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey: string | undefined,
    @Req() request: Request,
  ): Promise<OtpVerifyResponse> {
    const key = requireIdempotencyKey(idempotencyKey);
    const input = parseInput(otpVerifyBodySchema, body);
    const outcome = await this.otp.verify({
      phone: input.phone,
      code: input.code,
      device: input.device,
      ip: clientIp(request),
      idempotencyKey: key,
    });
    if (outcome.result === 'registration_required') {
      return shapeResponse(otpVerifyResponseSchema, outcome);
    }
    return shapeResponse(otpVerifyResponseSchema, {
      result: 'authenticated',
      session: outcome.session.tokens,
      account: accountSummary(outcome.account, outcome.session),
    });
  }

  @Post('registrations')
  @HttpCode(201)
  async register(
    @Body() body: unknown,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey: string | undefined,
    @Req() request: Request,
  ): Promise<RegistrationResponse> {
    const key = requireIdempotencyKey(idempotencyKey);
    const input = parseInput(registrationBodySchema, body);
    const outcome = await this.registration.register({
      registrationToken: input.registrationToken,
      dateOfBirth: input.dateOfBirth,
      device: input.device,
      ip: clientIp(request),
      idempotencyKey: key,
    });
    return shapeResponse(registrationResponseSchema, {
      result: 'authenticated',
      session: outcome.session.tokens,
      account: accountSummary(outcome.account, outcome.session),
    });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: unknown): Promise<RefreshResponse> {
    const input = parseInput(refreshBodySchema, body);
    const session = await this.sessions.refresh(input.refreshToken, input.device);
    return shapeResponse(refreshResponseSchema, { session: session.tokens });
  }

  /** Authenticated by possession of the refresh token; works after access expiry. */
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: unknown): Promise<void> {
    const input = parseInput(logoutBodySchema, body);
    await this.sessions.logout(input.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  @AllowAnyAccountStatus()
  async logoutAll(@CurrentAuth() auth: AuthContext): Promise<void> {
    await this.sessions.logoutAll(auth);
  }
}
