/**
 * Pre-account auth flow draft (A03 → A04/A05 → A04B → registration).
 *
 * Holds what the flow needs between screens, in MEMORY ONLY — never
 * persisted, logged or sent to analytics:
 * - the date of birth (collected first, sent only at registration),
 * - the phone number being verified (international form),
 * - the registration token returned for a number with no account yet,
 * - when a new code may be requested (server-provided cooldown).
 * Cleared on an under-age result, on sign-in/registration, or on abandon.
 */
interface Draft {
  dateOfBirth?: string;
  phone?: string;
  registrationToken?: string;
  resendAvailableAtMs?: number;
}

let draft: Draft = {};

export const registrationDraft = {
  setDateOfBirth(isoDate: string): void {
    draft.dateOfBirth = isoDate;
  },
  getDateOfBirth(): string | undefined {
    return draft.dateOfBirth;
  },
  /** A new number restarts verification: any earlier registration token is void. */
  setPhone(phone: string, resendAvailableAtMs: number): void {
    draft.phone = phone;
    draft.resendAvailableAtMs = resendAvailableAtMs;
    delete draft.registrationToken;
  },
  getPhone(): string | undefined {
    return draft.phone;
  },
  setResendAvailableAt(ms: number): void {
    draft.resendAvailableAtMs = ms;
  },
  getResendAvailableAt(): number | undefined {
    return draft.resendAvailableAtMs;
  },
  setRegistrationToken(token: string): void {
    draft.registrationToken = token;
  },
  getRegistrationToken(): string | undefined {
    return draft.registrationToken;
  },
  clear(): void {
    draft = {};
  },
};
