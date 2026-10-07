import { maskPhone } from '@project-connect/api-contracts';

import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { AccountStatus, OnboardingStatus, OnboardingStep } from '../domain/account.js';
import { ageInYears, parseCalendarDate } from '../domain/age.js';
import type { Clock, IdentityStore } from './ports.js';

export interface SelfAccountView {
  readonly id: string;
  readonly accountStatus: AccountStatus;
  readonly onboardingStatus: OnboardingStatus;
  readonly onboardingStep: OnboardingStep;
  /** Masked: calling code and last four digits only. */
  readonly phoneMasked: string;
  /** Whole years, server-computed. The date of birth never leaves identity. */
  readonly age: number;
}

export interface AccountStateView {
  readonly status: AccountStatus;
  readonly onboardingStatus: OnboardingStatus;
  readonly onboardingStep: OnboardingStep;
}

/** Identity's read side for other modules: privacy-projected, never raw PII. */
export class SelfAccountQuery {
  constructor(
    private readonly store: IdentityStore,
    private readonly clock: Clock,
  ) {}

  async getSelfAccount(userId: string): Promise<SelfAccountView> {
    const facts = await this.store.repository.findSelfAccountFacts(userId);
    const dateOfBirth = facts === undefined ? undefined : parseCalendarDate(facts.dateOfBirth);
    if (facts === undefined || dateOfBirth === undefined)
      throw new ApplicationError('AUTH_REQUIRED');
    return {
      id: facts.id,
      accountStatus: facts.accountStatus,
      onboardingStatus: facts.onboardingStatus,
      onboardingStep: facts.onboardingStep,
      phoneMasked: maskPhone(facts.phoneE164),
      age: ageInYears(dateOfBirth, this.clock.now()),
    };
  }

  async getAccountState(userId: string): Promise<AccountStateView | undefined> {
    const user = await this.store.repository.findUserById(userId);
    return user === undefined
      ? undefined
      : {
          status: user.accountStatus,
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep,
        };
  }
}
