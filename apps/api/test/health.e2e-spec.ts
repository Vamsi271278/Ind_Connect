import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';

describe('GET /health (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the minimal liveness payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toStrictEqual({ status: 'ok', service: 'api' });
  });

  it('is not cacheable and does not advertise the HTTP framework', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('is not served under the reserved consumer or admin API prefixes', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(404);
    await request(app.getHttpServer()).get('/admin/v1/health').expect(404);
  });

  it('no longer serves the scaffold root route', async () => {
    await request(app.getHttpServer()).get('/').expect(404);
  });
});
