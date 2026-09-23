import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

export type AuthPrincipal = {
  role: 'caregiver' | 'patient';
  caregiverId?: string;
  patientId?: string;
  demo: boolean;
};

function jwtSecret() {
  return process.env.JWT_SECRET ?? process.env.DEMO_JWT_SECRET ?? 'dev-only';
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  firebaseConfigured() {
    return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL);
  }

  sign(payload: AuthPrincipal): string {
    return jwt.sign(payload, jwtSecret(), { expiresIn: '12h' });
  }

  async verify(token: string): Promise<AuthPrincipal> {
    try {
      return jwt.verify(token, jwtSecret()) as AuthPrincipal;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async verifyFirebase(token: string): Promise<{ uid: string; phone?: string }> {
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'cognigame-ner' });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
          }),
        });
      }
    }
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, phone: decoded.phone_number };
  }

  async firebaseLogin(idToken: string) {
    const decoded = await this.verifyFirebase(idToken);
    let caregiver = await this.prisma.caregiver.findFirst({
      where: {
        OR: [
          { firebaseUid: decoded.uid },
          ...(decoded.phone ? [{ phone: decoded.phone }] : []),
        ],
      },
    });
    if (!caregiver && decoded.phone) {
      caregiver = await this.prisma.caregiver.create({
        data: {
          firebaseUid: decoded.uid,
          phone: decoded.phone,
          name: 'Caregiver',
          role: 'family',
        },
      });
    } else if (caregiver && !caregiver.firebaseUid) {
      caregiver = await this.prisma.caregiver.update({
        where: { id: caregiver.id },
        data: { firebaseUid: decoded.uid },
      });
    }
    if (!caregiver) {
      throw new UnauthorizedException('No caregiver linked to this Firebase user');
    }
    const token = this.sign({ role: 'caregiver', caregiverId: caregiver.id, demo: false });
    return { token, role: 'caregiver' as const, caregiver, demo: false };
  }

  async phoneLogin(phone: string) {
    const caregiver = await this.prisma.caregiver.findUnique({ where: { phone } });
    if (!caregiver) {
      throw new UnauthorizedException('No caregiver registered with this phone. Ask the clinic to add you.');
    }
    const token = this.sign({ role: 'caregiver', caregiverId: caregiver.id, demo: false });
    return { token, role: 'caregiver' as const, caregiver, demo: false };
  }

  async pairLogin(input: { pairingCode: string; deviceId: string; platform?: string }) {
    const patient = await this.prisma.patient.findUnique({ where: { pairingCode: input.pairingCode } });
    if (!patient || patient.deletedAt) throw new NotFoundException('Unknown pairing code');
    await this.prisma.device.upsert({
      where: { id: input.deviceId },
      create: {
        id: input.deviceId,
        patientId: patient.id,
        platform: input.platform ?? 'unknown',
        lastSeenAt: new Date(),
      },
      update: { lastSeenAt: new Date(), platform: input.platform ?? 'unknown' },
    });
    const token = this.sign({
      role: 'patient',
      patientId: patient.id,
      caregiverId: patient.caregiverId,
      demo: false,
    });
    return { token, role: 'patient' as const, patient, demo: false };
  }
}
