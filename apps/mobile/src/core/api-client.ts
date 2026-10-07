import {
  type BootstrapResponse,
  bootstrapResponseSchema,
  type CityListResponse,
  cityListResponseSchema,
  type DatingConsentResponse,
  datingConsentResponseSchema,
  type DeviceContext,
  errorEnvelopeSchema,
  IDEMPOTENCY_KEY_HEADER,
  type IntentOptionsResponse,
  intentOptionsResponseSchema,
  type MyIntentsResponse,
  myIntentsResponseSchema,
  type MyLocationResponse,
  myLocationResponseSchema,
  type OtpRequestResponse,
  otpRequestResponseSchema,
  type OtpVerifyResponse,
  otpVerifyResponseSchema,
  type RefreshResponse,
  refreshResponseSchema,
  type RegistrationResponse,
  registrationResponseSchema,
  type SelfUser,
  selfUserSchema,
  type UpdateMyIntentsBody,
  type UpdateMyLocationBody,
  type UpdateProfileBody,
} from '@project-connect/api-contracts';
import { z } from 'zod';

import { ApiResponseError, NetworkError } from './api-error';

/** What the client needs from the session (single-flight refresh lives there). */
export interface SessionAccess {
  getValidAccessToken(): Promise<string>;
  refreshAccessToken(): Promise<string>;
}

export interface ApiClientDependencies {
  readonly baseUrl: string;
  readonly fetch: typeof fetch;
  readonly correlationId: () => string;
  readonly timeoutMs: number;
}

type Auth = 'none' | 'optional' | 'required';

interface RequestSpec {
  readonly method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
  readonly auth: Auth;
  readonly idempotencyKey?: string;
}

const isAuthFailure = (error: unknown): boolean =>
  error instanceof ApiResponseError && error.status === 401 && error.code === 'AUTH_REQUIRED';

/**
 * Centralized API client. Responses are parsed with the shared contracts, so
 * the app only ever sees contract-valid data. Auth failures trigger ONE shared
 * refresh and one retry of the original request — no loops, no storms.
 */
export class ApiClient {
  private session: SessionAccess | undefined;

  constructor(private readonly deps: ApiClientDependencies) {}

  /** Wired after construction (the session itself uses this client to refresh). */
  attachSession(session: SessionAccess): void {
    this.session = session;
  }

  /** Performs the HTTP call; non-2xx becomes ApiResponseError, no response NetworkError. */
  private async fetchResponse(
    spec: RequestSpec,
    accessToken: string | undefined,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Correlation-ID': this.deps.correlationId(),
    };
    if (spec.body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken !== undefined) headers.Authorization = `Bearer ${accessToken}`;
    if (spec.idempotencyKey !== undefined) headers[IDEMPOTENCY_KEY_HEADER] = spec.idempotencyKey;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.deps.timeoutMs);
    let response: Response;
    try {
      response = await this.deps.fetch(`${this.deps.baseUrl}${spec.path}`, {
        method: spec.method,
        headers,
        body: spec.body === undefined ? null : JSON.stringify(spec.body),
        signal: controller.signal,
      });
    } catch {
      throw new NetworkError('Request failed before a response was received');
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) throw await this.toApiError(response);
    return response;
  }

  private async toApiError(response: Response): Promise<Error> {
    try {
      const envelope = errorEnvelopeSchema.parse(await response.json());
      return new ApiResponseError(
        response.status,
        envelope.error.code,
        envelope.error.details?.retryAfterSeconds,
      );
    } catch {
      return new NetworkError(`Unexpected HTTP ${String(response.status)} response`);
    }
  }

  private static async parseData<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new NetworkError('Unreadable response body');
    }
    const parsed = z.object({ data: schema }).safeParse(body);
    if (!parsed.success) throw new NetworkError('Response did not match the API contract');
    return parsed.data.data;
  }

  /** Applies the auth mode, including the single shared refresh + one retry. */
  private async withAuth<T>(
    auth: Auth,
    call: (token: string | undefined) => Promise<T>,
  ): Promise<T> {
    if (auth === 'none') return call(undefined);
    const session = this.session;
    if (session === undefined) throw new Error('ApiClient session not attached');

    if (auth === 'optional') {
      // Bootstrap: use a token when one can be obtained, never fail without one.
      return call(await session.getValidAccessToken().catch(() => undefined));
    }
    const token = await session.getValidAccessToken();
    try {
      return await call(token);
    } catch (error) {
      if (!isAuthFailure(error)) throw error;
      // One shared refresh, then exactly one retry of this request.
      return call(await session.refreshAccessToken());
    }
  }

  request<T>(spec: RequestSpec & { readonly schema: z.ZodType<T> }): Promise<T> {
    return this.withAuth(spec.auth, async (token) =>
      ApiClient.parseData(await this.fetchResponse(spec, token), spec.schema),
    );
  }

  requestNoContent(spec: RequestSpec): Promise<void> {
    return this.withAuth(spec.auth, async (token) => {
      await this.fetchResponse(spec, token);
    });
  }

  // ------------------------------------------------------------ endpoints

  getBootstrap(): Promise<BootstrapResponse> {
    return this.request({
      method: 'GET',
      path: '/api/v1/app/bootstrap',
      schema: bootstrapResponseSchema,
      auth: 'optional',
    });
  }

  requestOtp(phone: string, installId: string): Promise<OtpRequestResponse> {
    return this.request({
      method: 'POST',
      path: '/api/v1/auth/otp/request',
      body: { phone, installId },
      schema: otpRequestResponseSchema,
      auth: 'none',
    });
  }

  verifyOtp(
    input: { phone: string; code: string; device: DeviceContext },
    idempotencyKey: string,
  ): Promise<OtpVerifyResponse> {
    return this.request({
      method: 'POST',
      path: '/api/v1/auth/otp/verify',
      body: input,
      schema: otpVerifyResponseSchema,
      auth: 'none',
      idempotencyKey,
    });
  }

  register(
    input: { registrationToken: string; dateOfBirth: string; device: DeviceContext },
    idempotencyKey: string,
  ): Promise<RegistrationResponse> {
    return this.request({
      method: 'POST',
      path: '/api/v1/auth/registrations',
      body: input,
      schema: registrationResponseSchema,
      auth: 'none',
      idempotencyKey,
    });
  }

  refresh(refreshToken: string, device: DeviceContext): Promise<RefreshResponse> {
    return this.request({
      method: 'POST',
      path: '/api/v1/auth/refresh',
      body: { refreshToken, device },
      schema: refreshResponseSchema,
      auth: 'none',
    });
  }

  logout(refreshToken: string): Promise<void> {
    return this.requestNoContent({
      method: 'POST',
      path: '/api/v1/auth/logout',
      body: { refreshToken },
      auth: 'none',
    });
  }

  getMe(): Promise<SelfUser> {
    return this.request({
      method: 'GET',
      path: '/api/v1/users/me',
      schema: selfUserSchema,
      auth: 'required',
    });
  }

  updateProfile(body: UpdateProfileBody): Promise<SelfUser> {
    return this.request({
      method: 'PATCH',
      path: '/api/v1/users/me/profile',
      body,
      schema: selfUserSchema,
      auth: 'required',
    });
  }

  listCities(): Promise<CityListResponse> {
    return this.request({
      method: 'GET',
      path: '/api/v1/locations/cities',
      schema: cityListResponseSchema,
      auth: 'required',
    });
  }

  updateMyLocation(body: UpdateMyLocationBody): Promise<MyLocationResponse> {
    return this.request({
      method: 'PATCH',
      path: '/api/v1/users/me/location',
      body,
      schema: myLocationResponseSchema,
      auth: 'required',
    });
  }

  listIntentOptions(): Promise<IntentOptionsResponse> {
    return this.request({
      method: 'GET',
      path: '/api/v1/profile/intents',
      schema: intentOptionsResponseSchema,
      auth: 'required',
    });
  }

  updateMyIntents(body: UpdateMyIntentsBody): Promise<MyIntentsResponse> {
    return this.request({
      method: 'PUT',
      path: '/api/v1/users/me/intents',
      body,
      schema: myIntentsResponseSchema,
      auth: 'required',
    });
  }

  /** O05 affirmative opt-in for the policy version the server is serving. */
  putDatingConsent(policyVersion: string): Promise<DatingConsentResponse> {
    return this.request({
      method: 'PUT',
      path: '/api/v1/users/me/dating/consent',
      body: { policyVersion },
      schema: datingConsentResponseSchema,
      auth: 'required',
    });
  }

  /** Withdraws dating consent. Always allowed; idempotent. */
  deleteDatingConsent(): Promise<void> {
    return this.requestNoContent({
      method: 'DELETE',
      path: '/api/v1/users/me/dating/consent',
      auth: 'required',
    });
  }
}
