import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import {
  type InterestCatalogResponse,
  interestCatalogResponseSchema,
  type LanguageListResponse,
  languageListResponseSchema,
  type MyInterestsResponse,
  myInterestsResponseSchema,
  type MyLanguagesResponse,
  myLanguagesResponseSchema,
  updateMyInterestsBodySchema,
  updateMyLanguagesBodySchema,
} from '@project-connect/api-contracts';

import { parseInput, shapeResponse } from '../../../shared/http/parse.js';
import { AccessTokenGuard, CurrentAuth } from '../../identity/api/auth.guard.js';
import type { AuthContext } from '../../identity/application/session.service.js';
import type { TaxonomyService } from '../application/taxonomy.service.js';
import type { Language, SelectedInterest } from '../domain/taxonomy.js';
import { TAXONOMY_SERVICE } from './tokens.js';

const toLanguage = (l: Language) => ({ code: l.code, displayName: l.displayName });
const toSelectedInterest = (i: SelectedInterest) => ({
  code: i.code,
  label: i.label,
  categoryCode: i.categoryCode,
});

/** `/api/v1/profile/languages` and `/interests`: O06/O07 choices (codes, never ids). */
@Controller('profile')
@UseGuards(AccessTokenGuard)
export class TaxonomyController {
  constructor(@Inject(TAXONOMY_SERVICE) private readonly taxonomy: TaxonomyService) {}

  @Get('languages')
  async listLanguages(): Promise<LanguageListResponse> {
    const languages = await this.taxonomy.listLanguages();
    return shapeResponse(languageListResponseSchema, { languages: languages.map(toLanguage) });
  }

  @Get('interests')
  async listInterests(): Promise<InterestCatalogResponse> {
    const catalog = await this.taxonomy.listInterestCatalog();
    return shapeResponse(interestCatalogResponseSchema, {
      categories: catalog.map((c) => ({
        code: c.code,
        label: c.label,
        interests: c.interests.map((i) => ({ code: i.code, label: i.label })),
      })),
    });
  }
}

/** `/api/v1/users/me/languages` and `/interests`. Self only; full-set replace by code. */
@Controller('users/me')
@UseGuards(AccessTokenGuard)
export class MyTaxonomyController {
  constructor(@Inject(TAXONOMY_SERVICE) private readonly taxonomy: TaxonomyService) {}

  @Put('languages')
  async updateMyLanguages(
    @CurrentAuth() auth: AuthContext,
    @Body() body: unknown,
  ): Promise<MyLanguagesResponse> {
    const { languages } = parseInput(updateMyLanguagesBodySchema, body);
    const view = await this.taxonomy.updateMyLanguages(auth.userId, languages);
    return shapeResponse(myLanguagesResponseSchema, {
      languages: view.languages.map(toLanguage),
      onboarding: view.onboarding,
    });
  }

  @Put('interests')
  async updateMyInterests(
    @CurrentAuth() auth: AuthContext,
    @Body() body: unknown,
  ): Promise<MyInterestsResponse> {
    const { interests } = parseInput(updateMyInterestsBodySchema, body);
    const view = await this.taxonomy.updateMyInterests(auth.userId, interests);
    return shapeResponse(myInterestsResponseSchema, {
      interests: view.interests.map(toSelectedInterest),
      onboarding: view.onboarding,
    });
  }
}
