import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

export type AuthPrincipal = {
  role: 'caregiver' | 'patient';
  caregiverId?: string;
  patientId?: string;
  demo: boolean;
};

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  demoEnabled() {
    return process.env.DEMO_AUTH === 'true';
  }

  sign(payload: AuthPrincipal): string {
    const secret = process.env.DEMO_JWT_SECRET ?? 'dev-only';
    return jwt.sign(payload, secret, { expiresIn: '12h' });
  }

  async verify(token: string): Promise<AuthPrincipal> {
    if (this.demoEnabled()) {
      try {
        return jwt.verify(token, process.env.DEMO_JWT_SECRET ?? 'dev-only') as AuthPrincipal;
      } catch {
        /* fall through to firebase */
      }
    }
    if (process.env.FIREBASE_PROJECT_ID) {
      const decoded = await this.verifyFirebase(token);
      const caregiver = await this.prisma.caregiver.findUnique({
        where: { firebaseUid: decoded.uid },
      });
      if (caregiver) {
        return { role: 'caregiver', caregiverId: caregiver.id, demo: false };
      }
      throw new UnauthorizedException('No caregiver linked to this Firebase user');
    }
    throw new UnauthorizedException('Invalid token');
  }

  private async verifyFirebase(token: string): Promise<{ uid: string }> {
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
        }),
      });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid };
  }

  async demoLogin(input: { role: 'caregiver' | 'patient'; pairingCode?: string; phone?: string }) {
    if (!this.demoEnabled()) {
      throw new UnauthorizedException('Demo auth is disabled');
    }
    if (input.role === 'caregiver') {
      const caregiver = await this.prisma.caregiver.findFirst({
        where: input.phone ? { phone: input.phone } : {},
        orderBy: { createdAt: 'asc' },
      });
      if (!caregiver) throw new UnauthorizedException('No demo caregiver. Run prisma seed.');
      const token = this.sign({ role: 'caregiver', caregiverId: caregiver.id, demo: true });
      return { token, role: 'caregiver' as const, caregiver, demo: true };
    }
    const patient = await this.prisma.patient.findFirst({
      where: input.pairingCode ? { pairingCode: input.pairingCode } : {},
      orderBy: { createdAt: 'asc' },
    });
    if (!patient) throw new UnauthorizedException('No demo patient. Run prisma seed.');
    const token = this.sign({ role: 'patient', patientId: patient.id, caregiverId: patient.caregiverId, demo: true });
    return { token, role: 'patient' as const, patient, demo: true };
  }
}
