import { z } from 'zod';

import {
  logoutBodySchema,
  otpRequestBodySchema,
  otpRequestResponseSchema,
  otpVerifyBodySchema,
  otpVerifyResponseSchema,
  refreshBodySchema,
  refreshResponseSchema,
  registrationBodySchema,
  registrationResponseSchema,
} from './auth.js';
import { errorEnvelopeSchema } from './errors.js';
import {
  datingConsentResponseSchema,
  intentOptionsResponseSchema,
  myIntentsResponseSchema,
  putDatingConsentBodySchema,
  updateMyIntentsBodySchema,
} from './intents.js';
import {
  interestCatalogResponseSchema,
  languageListResponseSchema,
  myInterestsResponseSchema,
  myLanguagesResponseSchema,
  updateMyInterestsBodySchema,
  updateMyLanguagesBodySchema,
} from './taxonomy.js';
import {
  cityListResponseSchema,
  myLocationResponseSchema,
  updateMyLocationBodySchema,
} from './locations.js';
import { bootstrapResponseSchema, selfUserSchema, updateProfileBodySchema } from './users.js';

type Json = Record<string, unknown>;

/** JSON Schema (2020-12, as OpenAPI 3.1 uses) for a contract schema. */
function jsonSchema(schema: z.ZodType, io: 'input' | 'output'): Json {
  const generated = z.toJSONSchema(schema, { io, unrepresentable: 'any' });
  return Object.fromEntries(Object.entries(generated).filter(([key]) => key !== '$schema'));
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const dataEnvelope = (schemaName: string): Json => ({
  type: 'object',
  required: ['data'],
  additionalProperties: false,
  properties: { data: ref(schemaName) },
});

const jsonBody = (schema: Json) => ({ content: { 'application/json': { schema } } });

const success = (description: string, schemaName: string) => ({
  description,
  headers: { 'X-Correlation-ID': { $ref: '#/components/headers/CorrelationId' } },
  ...jsonBody(dataEnvelope(schemaName)),
});

const noContent = (description: string) => ({
  description,
  headers: { 'X-Correlation-ID': { $ref: '#/components/headers/CorrelationId' } },
});

/** Error responses, by HTTP status, all using the stable error envelope. */
const errors = (...statuses: number[]) =>
  Object.fromEntries(
    statuses.map((status) => [
      String(status),
      { $ref: `#/components/responses/Error${String(status)}` },
    ]),
  );

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Validation failure (VALIDATION_FAILED, PHONE_INVALID, OTP_EXPIRED, …)',
  401: 'Not authenticated (AUTH_REQUIRED, SESSION_INVALID)',
  403: 'Account or feature not available (ACCOUNT_NOT_ACTIVE, DATING_NOT_ELIGIBLE)',
  409: 'State conflict (idempotency, uniqueness, ONBOARDING_STEP_NOT_REACHED, DATING_POLICY_OUTDATED)',
  422: 'Business rule rejection (OTP_INCORRECT, AGE_NOT_ELIGIBLE, CITY_NOT_AVAILABLE, INTENT_REQUIRED)',
  429: 'Rate limited; see Retry-After (RATE_LIMITED, OTP_ATTEMPTS_EXCEEDED)',
  503: 'Dependency unavailable; fails closed (OTP_UNAVAILABLE, SERVICE_UNAVAILABLE)',
};

const correlationParameter = { $ref: '#/components/parameters/CorrelationId' };
const idempotencyParameter = { $ref: '#/components/parameters/IdempotencyKey' };

/**
 * The consumer API as an OpenAPI 3.1 document. Component schemas are derived
 * from the same Zod contracts the API validates with, so the document cannot
 * drift from runtime behavior; CI fails if the committed artifact differs.
 */
export function buildOpenApiDocument(): Json {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Project Connect Consumer API',
      version: '0.1.0',
      description:
        'Consumer API (`/api/v1`). Success responses use `{ "data": … }`; errors use the stable `{ "error": { code, message, correlationId } }` envelope. Clients branch on `error.code`.',
    },
    servers: [{ url: '/' }],
    tags: [
      { name: 'auth' },
      { name: 'users' },
      { name: 'locations' },
      { name: 'profile' },
      { name: 'dating' },
      { name: 'app' },
      { name: 'operations' },
    ],
    paths: {
      '/health': {
        get: {
          operationId: 'getHealth',
          tags: ['operations'],
          summary: 'Liveness (outside the /api/v1 namespace; not enveloped)',
          responses: {
            '200': {
              description: 'Process is serving HTTP',
              ...jsonBody({
                type: 'object',
                required: ['status', 'service'],
                additionalProperties: false,
                properties: { status: { const: 'ok' }, service: { const: 'api' } },
              }),
            },
          },
        },
      },
      '/api/v1/app/bootstrap': {
        get: {
          operationId: 'getBootstrap',
          tags: ['app'],
          summary: 'Public app bootstrap state (ADR-076); account only with a valid access token',
          parameters: [correlationParameter],
          security: [{}, { bearerAuth: [] }],
          responses: { '200': success('Bootstrap state', 'BootstrapResponse') },
        },
      },
      '/api/v1/auth/otp/request': {
        post: {
          operationId: 'requestOtp',
          tags: ['auth'],
          summary: 'Start a phone verification; identical response for every accepted number',
          parameters: [correlationParameter],
          requestBody: { required: true, ...jsonBody(ref('OtpRequestBody')) },
          responses: {
            '202': success('Code sent', 'OtpRequestResponse'),
            ...errors(400, 429, 503),
          },
        },
      },
      '/api/v1/auth/otp/verify': {
        post: {
          operationId: 'verifyOtp',
          tags: ['auth'],
          summary: 'Verify the code; signs in an existing account or returns a registration token',
          parameters: [correlationParameter, idempotencyParameter],
          requestBody: { required: true, ...jsonBody(ref('OtpVerifyBody')) },
          responses: {
            '200': success('Verified', 'OtpVerifyResponse'),
            ...errors(400, 403, 409, 422, 429, 503),
          },
        },
      },
      '/api/v1/auth/registrations': {
        post: {
          operationId: 'register',
          tags: ['auth'],
          summary:
            'Create the account from a registration token and date of birth (server age authority)',
          parameters: [correlationParameter, idempotencyParameter],
          requestBody: { required: true, ...jsonBody(ref('RegistrationBody')) },
          responses: {
            '201': success('Account created', 'RegistrationResponse'),
            ...errors(400, 409, 422, 429, 503),
          },
        },
      },
      '/api/v1/auth/refresh': {
        post: {
          operationId: 'refreshSession',
          tags: ['auth'],
          summary: 'Rotate the refresh token',
          parameters: [correlationParameter],
          requestBody: { required: true, ...jsonBody(ref('RefreshBody')) },
          responses: {
            '200': success('New token pair', 'RefreshResponse'),
            ...errors(400, 401, 403, 429),
          },
        },
      },
      '/api/v1/auth/logout': {
        post: {
          operationId: 'logout',
          tags: ['auth'],
          summary: 'End the sign-in that owns this refresh token (always 204)',
          parameters: [correlationParameter],
          requestBody: { required: true, ...jsonBody(ref('LogoutBody')) },
          responses: { '204': noContent('Signed out'), ...errors(400) },
        },
      },
      '/api/v1/auth/logout-all': {
        post: {
          operationId: 'logoutAll',
          tags: ['auth'],
          summary: 'Revoke every session of the authenticated user',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: { '204': noContent('All sessions revoked'), ...errors(401) },
        },
      },
      '/api/v1/users/me': {
        get: {
          operationId: 'getMe',
          tags: ['users'],
          summary: 'Own-account projection (masked phone, computed age; never DOB)',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: { '200': success('Own account', 'SelfUser'), ...errors(401, 403) },
        },
      },
      '/api/v1/users/me/profile': {
        patch: {
          operationId: 'updateMyProfile',
          tags: ['users'],
          summary: 'Update onboarding profile fields (first name, gender); advances onboarding',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, ...jsonBody(ref('UpdateProfileBody')) },
          responses: {
            '200': success('Updated own account', 'SelfUser'),
            ...errors(400, 401, 403),
          },
        },
      },
      '/api/v1/users/me/location': {
        patch: {
          operationId: 'updateMyLocation',
          tags: ['users'],
          summary:
            'Set the current city (manual selection; server derives metro/country). Allowed from the LOCATION onboarding step onward; advances LOCATION → INTENT',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, ...jsonBody(ref('UpdateMyLocationBody')) },
          responses: {
            '200': success('Current location (city/metro only)', 'MyLocationResponse'),
            ...errors(400, 401, 403, 409, 422),
          },
        },
      },
      '/api/v1/profile/intents': {
        get: {
          operationId: 'listIntentOptions',
          tags: ['profile'],
          summary:
            'Top-level intent options; DATING and the dating policy version only while the Dating kill switch is on',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': success('Intent options', 'IntentOptionsResponse'),
            ...errors(401, 403),
          },
        },
      },
      '/api/v1/profile/languages': {
        get: {
          operationId: 'listLanguages',
          tags: ['profile'],
          summary: 'Active languages in display order (bounded reference data)',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: { '200': success('Languages', 'LanguageListResponse'), ...errors(401, 403) },
        },
      },
      '/api/v1/profile/interests': {
        get: {
          operationId: 'listInterests',
          tags: ['profile'],
          summary: 'Active interest categories, each with its active interests',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': success('Interest catalog', 'InterestCatalogResponse'),
            ...errors(401, 403),
          },
        },
      },
      '/api/v1/users/me/languages': {
        put: {
          operationId: 'updateMyLanguages',
          tags: ['users'],
          summary:
            'Replace the languages (at least 1, by code). Atomic: any unknown or inactive code fails the whole save. Allowed from LANGUAGE onward; advances LANGUAGE to INTERESTS',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, ...jsonBody(ref('UpdateMyLanguagesBody')) },
          responses: {
            '200': success('Saved languages', 'MyLanguagesResponse'),
            ...errors(400, 401, 403, 409),
          },
        },
      },
      '/api/v1/users/me/interests': {
        put: {
          operationId: 'updateMyInterests',
          tags: ['users'],
          summary:
            'Replace the interests (at least 3, by code). Atomic: any unknown or inactive code fails the whole save. Allowed from INTERESTS onward; advances INTERESTS to PHOTO',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, ...jsonBody(ref('UpdateMyInterestsBody')) },
          responses: {
            '200': success('Saved interests', 'MyInterestsResponse'),
            ...errors(400, 401, 403, 409),
          },
        },
      },
      '/api/v1/users/me/intents': {
        put: {
          operationId: 'updateMyIntents',
          tags: ['users'],
          summary:
            'Replace the active non-dating intents (DATING changes only via dating consent). Allowed from INTENT onward; advances INTENT → LANGUAGE',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, ...jsonBody(ref('UpdateMyIntentsBody')) },
          responses: {
            '200': success('Active intents', 'MyIntentsResponse'),
            ...errors(400, 401, 403, 409, 422),
          },
        },
      },
      '/api/v1/users/me/dating/consent': {
        put: {
          operationId: 'putMyDatingConsent',
          tags: ['dating'],
          summary:
            'Affirmatively opt in to Dating for the current policy version; records consent and activates DATING atomically. Idempotent',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, ...jsonBody(ref('PutDatingConsentBody')) },
          responses: {
            '200': success('Dating enabled', 'DatingConsentResponse'),
            ...errors(400, 401, 403, 409),
          },
        },
        delete: {
          operationId: 'deleteMyDatingConsent',
          tags: ['dating'],
          summary:
            'Withdraw dating consent and deactivate DATING atomically. Never blocked (kill switch, onboarding step or intent minimum). Idempotent',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: { '204': noContent('Dating disabled'), ...errors(401) },
        },
      },
      '/api/v1/locations/cities': {
        get: {
          operationId: 'listCities',
          tags: ['locations'],
          summary: 'Selectable launch cities (bounded taxonomy; no coordinates)',
          parameters: [correlationParameter],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': success('Selectable cities', 'CityListResponse'),
            ...errors(401, 403),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ed25519-signed access token (15 minutes).',
        },
      },
      parameters: {
        CorrelationId: {
          name: 'X-Correlation-ID',
          in: 'header',
          required: false,
          description: 'Optional client correlation ID (8–64 chars of [A-Za-z0-9-]); echoed back.',
          schema: { type: 'string', pattern: '^[A-Za-z0-9-]{8,64}$' },
        },
        IdempotencyKey: {
          name: 'Idempotency-Key',
          in: 'header',
          required: true,
          description:
            'UUID per user submission; reuse it for network retries of the same submission. A different payload with the same key is rejected.',
          schema: { type: 'string', format: 'uuid' },
        },
      },
      headers: {
        CorrelationId: {
          description: 'Request correlation ID',
          schema: { type: 'string' },
        },
      },
      responses: Object.fromEntries(
        Object.entries(ERROR_DESCRIPTIONS).map(([status, description]) => [
          `Error${status}`,
          {
            description,
            headers: { 'X-Correlation-ID': { $ref: '#/components/headers/CorrelationId' } },
            ...jsonBody(ref('ErrorEnvelope')),
          },
        ]),
      ),
      schemas: {
        ErrorEnvelope: jsonSchema(errorEnvelopeSchema, 'output'),
        OtpRequestBody: jsonSchema(otpRequestBodySchema, 'input'),
        OtpRequestResponse: jsonSchema(otpRequestResponseSchema, 'output'),
        OtpVerifyBody: jsonSchema(otpVerifyBodySchema, 'input'),
        OtpVerifyResponse: jsonSchema(otpVerifyResponseSchema, 'output'),
        RegistrationBody: jsonSchema(registrationBodySchema, 'input'),
        RegistrationResponse: jsonSchema(registrationResponseSchema, 'output'),
        RefreshBody: jsonSchema(refreshBodySchema, 'input'),
        RefreshResponse: jsonSchema(refreshResponseSchema, 'output'),
        LogoutBody: jsonSchema(logoutBodySchema, 'input'),
        UpdateProfileBody: jsonSchema(updateProfileBodySchema, 'input'),
        SelfUser: jsonSchema(selfUserSchema, 'output'),
        BootstrapResponse: jsonSchema(bootstrapResponseSchema, 'output'),
        CityListResponse: jsonSchema(cityListResponseSchema, 'output'),
        IntentOptionsResponse: jsonSchema(intentOptionsResponseSchema, 'output'),
        LanguageListResponse: jsonSchema(languageListResponseSchema, 'output'),
        InterestCatalogResponse: jsonSchema(interestCatalogResponseSchema, 'output'),
        UpdateMyLanguagesBody: jsonSchema(updateMyLanguagesBodySchema, 'input'),
        UpdateMyInterestsBody: jsonSchema(updateMyInterestsBodySchema, 'input'),
        MyLanguagesResponse: jsonSchema(myLanguagesResponseSchema, 'output'),
        MyInterestsResponse: jsonSchema(myInterestsResponseSchema, 'output'),
        UpdateMyIntentsBody: jsonSchema(updateMyIntentsBodySchema, 'input'),
        MyIntentsResponse: jsonSchema(myIntentsResponseSchema, 'output'),
        PutDatingConsentBody: jsonSchema(putDatingConsentBodySchema, 'input'),
        DatingConsentResponse: jsonSchema(datingConsentResponseSchema, 'output'),
        UpdateMyLocationBody: jsonSchema(updateMyLocationBodySchema, 'input'),
        MyLocationResponse: jsonSchema(myLocationResponseSchema, 'output'),
      },
    },
  };
}
