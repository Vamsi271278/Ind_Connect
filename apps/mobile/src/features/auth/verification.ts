import type {
  DeviceContext,
  OtpRequestResponse,
  SessionTokens,
} from '@project-connect/api-contracts';

import { api, getInstallId, session } from '@/app-shell/services';
import { registrationDraft } from '@/core/registration-draft';
import { createSubmission } from '@/core/submission';
import { deviceContext } from '@/platform/device';
import { generateIdempotencyKey } from '@/platform/random';

/**
 * Auth flow orchestration shared by A03/A04/A04B/A05. Screens call these and
 * render outcomes; credentials only ever pass through SessionManager.
 */

const device = async (): Promise<DeviceContext> => deviceContext(await getInstallId());

/** POST /auth/otp/request, then remember the number and the resend cooldown. */
export async function requestCode(phone: string): Promise<OtpRequestResponse> {
  const result = await api.requestOtp(phone, await getInstallId());
  registrationDraft.setPhone(phone, Date.now() + result.resendAvailableInSeconds * 1000);
  return result;
}

/** Session obtained: hand it to SessionManager; routing moves on centrally. */
async function finish(tokens: SessionTokens): Promise<void> {
  await session.establish(tokens);
  registrationDraft.clear();
}

/**
 * POST /auth/registrations with the DOB from A03. One submission = one
 * idempotency key, reused for transient retries.
 */
export async function register(registrationToken: string, dateOfBirth: string): Promise<void> {
  const submission = createSubmission(generateIdempotencyKey);
  const context = await device();
  const result = await submission.run((key) =>
    api.register({ registrationToken, dateOfBirth, device: context }, key),
  );
  await finish(result.session);
}

export type VerifyOutcome = 'signed-in' | 'needs-date-of-birth';

/**
 * POST /auth/otp/verify. Existing account → signed in. New number → register
 * with the A03 date of birth, or (sign-in path) ask for it first.
 */
export async function verifyCode(phone: string, code: string): Promise<VerifyOutcome> {
  const submission = createSubmission(generateIdempotencyKey);
  const context = await device();
  const result = await submission.run((key) =>
    api.verifyOtp({ phone, code, device: context }, key),
  );
  if (result.result === 'authenticated') {
    await finish(result.session);
    return 'signed-in';
  }
  registrationDraft.setRegistrationToken(result.registrationToken);
  const dateOfBirth = registrationDraft.getDateOfBirth();
  if (dateOfBirth === undefined) return 'needs-date-of-birth';
  await register(result.registrationToken, dateOfBirth);
  return 'signed-in';
}
