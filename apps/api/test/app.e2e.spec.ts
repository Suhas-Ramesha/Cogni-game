import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('auth + health (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DEMO_AUTH = 'true';
    process.env.DEMO_JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.ok).toBe(true);
  });

  it('demo login requires seed caregiver', async () => {
    const caregiver = await prisma.caregiver.findFirst();
    if (!caregiver) return;
    const res = await request(app.getHttpServer())
      .post('/auth/demo')
      .send({ role: 'caregiver', phone: caregiver.phone })
      .expect(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.demo).toBe(true);
  });
});
