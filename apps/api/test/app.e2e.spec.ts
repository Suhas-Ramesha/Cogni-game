import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('auth + health (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
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

  it('phone login works for a registered caregiver', async () => {
    const caregiver = await prisma.caregiver.upsert({
      where: { phone: '+916000000001' },
      update: {},
      create: { name: 'Anjali Das', phone: '+916000000001', role: 'health_worker' },
    });
    const res = await request(app.getHttpServer())
      .post('/auth/phone')
      .send({ phone: caregiver.phone })
      .expect(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.demo).toBe(false);
    expect(res.body.caregiver.phone).toBe(caregiver.phone);
  });

  it('pairing issues a patient session', async () => {
    const caregiver = await prisma.caregiver.upsert({
      where: { phone: '+916000000001' },
      update: {},
      create: { name: 'Anjali Das', phone: '+916000000001', role: 'health_worker' },
    });
    const patient = await prisma.patient.upsert({
      where: { pairingCode: '482193' },
      update: {},
      create: {
        name: 'Rita Sharma',
        preferredLanguage: 'as',
        dateOfBirth: new Date('1948-03-12'),
        caregiverId: caregiver.id,
        pairingCode: '482193',
      },
    });
    const res = await request(app.getHttpServer())
      .post('/auth/pair')
      .send({ pairingCode: patient.pairingCode, deviceId: 'device-e2e-rita', platform: 'test' })
      .expect(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe('patient');
    expect(res.body.patient.id).toBe(patient.id);
  });
});
