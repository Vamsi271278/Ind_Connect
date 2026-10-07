import { createPrivateKey, type KeyObject } from 'node:crypto';

import { z } from 'zod';

import { Secret } from './secret.js';

export type CountryPolicy =
  | { readonly mode: 'all' }
  | { readonly mode: 'allowlist'; readonly countries: ReadonlySet<string> };

export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'staging' | 'production';
  readonly port: number;
  /** Express `trust proxy` hop count; 0 trusts no forwarding headers. */
  readonly trustProxy: number;
  readonly database: { readonly url: Secret };
  readonly redis: { readonly url: Secret };
  readonly otp: {
    readonly provider: 'fake';
    readonly fakeCode: Secret;
    readonly codeTtlSeconds: number;
    readonly maxAttempts: number;
    readonly resendCooldownSeconds: number;
    readonly providerTimeoutMs: number;
    readonly sendsPerPhonePerHour: number;
    readonly sendsPerPhonePerDay: number;
    readonly sendsPerIpPerHour: number;
    readonly sendsPerDevicePerHour: number;
    readonly verifiesPerIpPerHour: number;
  };
  readonly phone: {
    /** Keys the HMAC used for log-safe and Redis-safe phone/IP identifiers. */
    readonly hashPepper: Secret;
    readonly countryPolicy: CountryPolicy;
  };
  readonly tokens: {
    readonly issuer: string;
    readonly audience: string;
    readonly privateKey: KeyObject;
    readonly keyId: string;
    readonly accessTtlSeconds: number;
    readonly refreshRollingDays: number;
    readonly familyMaxDays: number;
    readonly refreshGraceSeconds: number;
  };
  readonly registration: {
    readonly tokenTtlSeconds: number;
    readonly perIpPerHour: number;
  };
  readonly refresh: { readonly perFamilyPerHour: number };
  readonly idempotency: { readonly ttlSeconds: number; readonly lockSeconds: number };
  /**
   * ADR-094 / ADR-032 Dating kill switch (T&S §190: off until the release gate
   * is met). `policyVersion` is the dating policy a consent is recorded
   * against; it is required whenever Dating is enabled.
   */
  readonly dating: {
    readonly enabled: boolean;
    readonly policyVersion: string | null;
  };
  /** ADR-076 public bootstrap state (ADR-032 flag store not built yet: config only). */
  readonly bootstrap: {
    readonly maintenanceMode: boolean;
    readonly minimumSupportedVersion: string;
    readonly featureFlags: Readonly<Record<string, boolean>>;
  };
}

const positiveInt = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const connectionUrl = (protocols: readonly string[]) =>
  z.string().refine(
    (value) => {
      try {
        return protocols.includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { message: `must be a ${protocols.join(' or ')} URL` },
  );

const countryPolicySchema = z
  .string()
  .trim()
  .min(1)
  .transform((raw, ctx): CountryPolicy => {
    if (raw === '*') return { mode: 'all' };
    const codes = raw.split(',').map((code) => code.trim().toUpperCase());
    if (codes.some((code) => !/^[A-Z]{2}$/.test(code))) {
      ctx.addIssue({
        code: 'custom',
        message: 'must be "*" or comma-separated ISO 3166-1 alpha-2 codes',
      });
      return z.NEVER;
    }
    return { mode: 'allowlist', countries: new Set(codes) };
  });

const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

const featureFlagsSchema = z.string().transform((raw, ctx): Record<string, boolean> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  const flags = z.record(z.string().regex(/^[a-z][a-z0-9_]{0,63}$/), z.boolean()).safeParse(parsed);
  if (flags.success) return flags.data;
  ctx.addIssue({
    code: 'custom',
    message: 'must be a JSON object of snake_case flag names to booleans',
  });
  return z.NEVER;
});

const ed25519PrivateKeySchema = z.string().transform((raw, ctx): KeyObject => {
  try {
    const key = createPrivateKey(Buffer.from(raw, 'base64').toString('utf8'));
    if (key.asymmetricKeyType === 'ed25519') return key;
  } catch {
    // fall through: the error message must not echo key material
  }
  ctx.addIssue({ code: 'custom', message: 'must be a base64-encoded PKCS#8 PEM Ed25519 key' });
  return z.NEVER;
});

/**
 * Environment contract. Policy values default to the approved initial limits;
 * connection strings, keys and secrets have no defaults and must be supplied.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
    PORT: positiveInt(3000),
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),

    DATABASE_URL: connectionUrl(['postgres:', 'postgresql:']),
    REDIS_URL: connectionUrl(['redis:', 'rediss:']),

    OTP_PROVIDER: z.enum(['fake']),
    // Required while 'fake' is the only provider; becomes conditional with Twilio.
    OTP_FAKE_CODE: z.string().regex(/^\d{6}$/),
    OTP_CODE_TTL_SECONDS: positiveInt(300),
    OTP_MAX_ATTEMPTS: positiveInt(5),
    OTP_RESEND_COOLDOWN_SECONDS: positiveInt(30),
    OTP_PROVIDER_TIMEOUT_MS: positiveInt(5000),
    OTP_SENDS_PER_PHONE_PER_HOUR: positiveInt(5),
    OTP_SENDS_PER_PHONE_PER_DAY: positiveInt(10),
    OTP_SENDS_PER_IP_PER_HOUR: positiveInt(20),
    OTP_SENDS_PER_DEVICE_PER_HOUR: positiveInt(10),
    OTP_VERIFIES_PER_IP_PER_HOUR: positiveInt(30),

    PHONE_HASH_PEPPER: z.string().min(32),
    PHONE_ALLOWED_COUNTRIES: countryPolicySchema,

    ACCESS_TOKEN_ISSUER: z.string().min(1),
    ACCESS_TOKEN_AUDIENCE: z.string().min(1),
    ACCESS_TOKEN_PRIVATE_KEY: ed25519PrivateKeySchema,
    ACCESS_TOKEN_KEY_ID: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),
    ACCESS_TOKEN_TTL_SECONDS: positiveInt(900),
    REFRESH_TOKEN_ROLLING_DAYS: positiveInt(30),
    SESSION_FAMILY_MAX_DAYS: positiveInt(90),
    REFRESH_GRACE_SECONDS: positiveInt(30),
    REFRESHES_PER_FAMILY_PER_HOUR: positiveInt(120),

    REGISTRATION_TOKEN_TTL_SECONDS: positiveInt(600),
    REGISTRATIONS_PER_IP_PER_HOUR: positiveInt(20),

    IDEMPOTENCY_TTL_SECONDS: positiveInt(3600),
    IDEMPOTENCY_LOCK_SECONDS: positiveInt(30),

    MAINTENANCE_MODE: booleanFlag.default(false),
    MOBILE_MINIMUM_SUPPORTED_VERSION: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .default('0.0.0'),
    FEATURE_FLAGS: featureFlagsSchema.default({}),

    // Off by default everywhere. Enable deliberately (local/staging testing),
    // never just because the code exists.
    DATING_ENABLED: booleanFlag.default(false),
    // Same format as dating_consents.policy_version.
    DATING_POLICY_VERSION: z
      .string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/)
      .optional(),
  })
  .superRefine((env, ctx) => {
    // 'fake' is the only provider until the Twilio adapter is approved, so
    // production cannot start at all.
    if (env.NODE_ENV === 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['OTP_PROVIDER'],
        message: 'the fake OTP provider can never run in production',
      });
    }
    if ('dating_enabled' in env.FEATURE_FLAGS) {
      ctx.addIssue({
        code: 'custom',
        path: ['FEATURE_FLAGS'],
        message: 'dating_enabled is controlled only by DATING_ENABLED',
      });
    }
    if (env.DATING_ENABLED && env.DATING_POLICY_VERSION === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATING_POLICY_VERSION'],
        message: 'is required when DATING_ENABLED=true',
      });
    }
    if (
      env.NODE_ENV === 'production' &&
      env.DATING_ENABLED &&
      /draft/i.test(env.DATING_POLICY_VERSION ?? '')
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATING_POLICY_VERSION'],
        message: 'a draft dating policy version cannot be enabled in production',
      });
    }
    if (env.SESSION_FAMILY_MAX_DAYS < env.REFRESH_TOKEN_ROLLING_DAYS) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_FAMILY_MAX_DAYS'],
        message: 'must be >= REFRESH_TOKEN_ROLLING_DAYS',
      });
    }
  });

export class ConfigValidationError extends Error {
  override readonly name = 'ConfigValidationError';
}

/**
 * Parses and validates configuration from the environment. Fails fast on any
 * problem; error messages name the offending keys but never echo values.
 */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new ConfigValidationError(`Invalid configuration: ${problems}`);
  }
  const e = parsed.data;

  return Object.freeze({
    nodeEnv: e.NODE_ENV,
    port: e.PORT,
    trustProxy: e.TRUST_PROXY,
    database: { url: new Secret(e.DATABASE_URL) },
    redis: { url: new Secret(e.REDIS_URL) },
    otp: {
      provider: e.OTP_PROVIDER,
      fakeCode: new Secret(e.OTP_FAKE_CODE),
      codeTtlSeconds: e.OTP_CODE_TTL_SECONDS,
      maxAttempts: e.OTP_MAX_ATTEMPTS,
      resendCooldownSeconds: e.OTP_RESEND_COOLDOWN_SECONDS,
      providerTimeoutMs: e.OTP_PROVIDER_TIMEOUT_MS,
      sendsPerPhonePerHour: e.OTP_SENDS_PER_PHONE_PER_HOUR,
      sendsPerPhonePerDay: e.OTP_SENDS_PER_PHONE_PER_DAY,
      sendsPerIpPerHour: e.OTP_SENDS_PER_IP_PER_HOUR,
      sendsPerDevicePerHour: e.OTP_SENDS_PER_DEVICE_PER_HOUR,
      verifiesPerIpPerHour: e.OTP_VERIFIES_PER_IP_PER_HOUR,
    },
    phone: {
      hashPepper: new Secret(e.PHONE_HASH_PEPPER),
      countryPolicy: e.PHONE_ALLOWED_COUNTRIES,
    },
    tokens: {
      issuer: e.ACCESS_TOKEN_ISSUER,
      audience: e.ACCESS_TOKEN_AUDIENCE,
      privateKey: e.ACCESS_TOKEN_PRIVATE_KEY,
      keyId: e.ACCESS_TOKEN_KEY_ID,
      accessTtlSeconds: e.ACCESS_TOKEN_TTL_SECONDS,
      refreshRollingDays: e.REFRESH_TOKEN_ROLLING_DAYS,
      familyMaxDays: e.SESSION_FAMILY_MAX_DAYS,
      refreshGraceSeconds: e.REFRESH_GRACE_SECONDS,
    },
    registration: {
      tokenTtlSeconds: e.REGISTRATION_TOKEN_TTL_SECONDS,
      perIpPerHour: e.REGISTRATIONS_PER_IP_PER_HOUR,
    },
    refresh: { perFamilyPerHour: e.REFRESHES_PER_FAMILY_PER_HOUR },
    idempotency: { ttlSeconds: e.IDEMPOTENCY_TTL_SECONDS, lockSeconds: e.IDEMPOTENCY_LOCK_SECONDS },
    dating: {
      enabled: e.DATING_ENABLED,
      policyVersion: e.DATING_POLICY_VERSION ?? null,
    },
    bootstrap: {
      maintenanceMode: e.MAINTENANCE_MODE,
      minimumSupportedVersion: e.MOBILE_MINIMUM_SUPPORTED_VERSION,
      // The evaluated kill switch is the only source of dating_enabled.
      featureFlags: { ...e.FEATURE_FLAGS, dating_enabled: e.DATING_ENABLED },
    },
  });
}
