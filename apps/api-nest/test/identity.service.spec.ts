import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IdentityService } from '../src/modules/identity/identity.service';
import { IdentityRepository } from '../src/modules/identity/identity.repository';
import { RiskService } from '../src/modules/identity/risk.service';

describe('IdentityService', () => {
  let svc: IdentityService;
  const ctx = { ip: '1.1.1.1', userAgent: 'jest' };
  const passwordHash = bcrypt.hashSync('Password123!', 4);

  const repo = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createIdentity: jest.fn(),
    setPassword: jest.fn(),
    incrementFailed: jest.fn(),
    resetFailed: jest.fn(),
    markEmailVerified: jest.fn(),
    createEmailVerification: jest.fn(),
    consumeEmailVerification: jest.fn(),
    createPasswordReset: jest.fn(),
    consumePasswordReset: jest.fn(),
    createSession: jest.fn().mockResolvedValue({ id: 's1', expiresAt: new Date().toISOString() }),
    findActiveSessionByRefresh: jest.fn(),
    revokeSessionByHash: jest.fn(),
    listSessions: jest.fn(),
    revokeSession: jest.fn(),
    logAttempt: jest.fn(),
    recentAttempts: jest.fn().mockResolvedValue([]),
    createMfaFactor: jest.fn(),
    activateMfa: jest.fn(),
    listMfa: jest.fn().mockResolvedValue([]),
    hasActiveMfa: jest.fn().mockResolvedValue(false),
    getFactor: jest.fn(),
    getOnboarding: jest.fn(),
    upsertOnboarding: jest.fn(),
    createVerification: jest.fn(),
    listVerifications: jest.fn(),
    pendingVerifications: jest.fn(),
    decideVerification: jest.fn(),
    audit: jest.fn(),
  };
  const risk = { scoreLogin: jest.fn().mockResolvedValue({ score: 10, band: 'low', reasons: [], mfaRequired: false }) };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: IdentityRepository, useValue: repo },
        { provide: RiskService, useValue: risk },
        { provide: JwtService, useValue: new JwtService({ secret: 'test', signOptions: { expiresIn: '15m' } }) },
      ],
    }).compile();
    svc = mod.get(IdentityService);
  });

  beforeEach(() => jest.clearAllMocks());

  it('signup rejects duplicates', async () => {
    repo.findByEmail.mockResolvedValueOnce({ id: 'x' });
    await expect(svc.signup({ email: 'a@b.co', password: 'Password123!' } as any, ctx))
      .rejects.toThrow('email_already_registered');
  });

  it('signup creates identity, verification token, returns tokens', async () => {
    repo.findByEmail.mockResolvedValueOnce(null);
    repo.createIdentity.mockResolvedValueOnce({ id: 'u1', email: 'a@b.co', display_name: 'A', email_verified: false, status: 'active' });
    risk.scoreLogin.mockResolvedValueOnce({ score: 10, band: 'low', reasons: [], mfaRequired: false });
    const out = await svc.signup({ email: 'a@b.co', password: 'Password123!' } as any, ctx);
    expect(out.accessToken).toBeTruthy();
    expect(out.refreshToken).toBeTruthy();
    expect(out.verificationToken).toBeTruthy();
    expect(repo.createEmailVerification).toHaveBeenCalled();
  });

  it('login rejects bad password and increments failed counter', async () => {
    repo.findByEmail.mockResolvedValueOnce({ id: 'u1', email: 'a@b.co', password_hash: passwordHash, status: 'active' });
    repo.incrementFailed.mockResolvedValueOnce({ failed_attempts: 1, locked_until: null, status: 'active' });
    await expect(svc.login({ email: 'a@b.co', password: 'wrong' } as any, ctx))
      .rejects.toThrow('invalid_credentials');
    expect(repo.incrementFailed).toHaveBeenCalled();
  });

  it('login locks the account on threshold', async () => {
    repo.findByEmail.mockResolvedValueOnce({ id: 'u1', email: 'a@b.co', password_hash: passwordHash, status: 'active' });
    repo.incrementFailed.mockResolvedValueOnce({ failed_attempts: 5, locked_until: new Date(Date.now() + 60_000), status: 'locked' });
    await expect(svc.login({ email: 'a@b.co', password: 'wrong' } as any, ctx))
      .rejects.toThrow('account_locked');
  });

  it('login succeeds with correct password and issues tokens', async () => {
    repo.findByEmail.mockResolvedValueOnce({ id: 'u1', email: 'a@b.co', display_name: 'A',
      password_hash: passwordHash, status: 'active', email_verified: true });
    const out: any = await svc.login({ email: 'a@b.co', password: 'Password123!' } as any, ctx);
    expect(out.accessToken).toBeTruthy();
    expect(out.identity.id).toBe('u1');
  });

  it('login returns mfaRequired when high risk and no code', async () => {
    repo.findByEmail.mockResolvedValueOnce({ id: 'u1', email: 'a@b.co', password_hash: passwordHash, status: 'active' });
    risk.scoreLogin.mockResolvedValueOnce({ score: 80, band: 'high', reasons: ['x'], mfaRequired: true });
    const out: any = await svc.login({ email: 'a@b.co', password: 'Password123!' } as any, ctx);
    expect(out.mfaRequired).toBe(true);
  });

  it('reset password rejects unknown token', async () => {
    repo.consumePasswordReset.mockResolvedValueOnce(null);
    await expect(svc.resetPassword('bad', 'NewPass123!', ctx)).rejects.toThrow('invalid_or_expired_token');
  });

  it('verify email rejects unknown token', async () => {
    repo.consumeEmailVerification.mockResolvedValueOnce(null);
    await expect(svc.verifyEmail('bad', ctx)).rejects.toThrow('invalid_or_expired_token');
  });

  it('onboarding patch is delegated to repo', async () => {
    repo.upsertOnboarding.mockResolvedValueOnce({ identityId: 'u1', status: 'in_progress', currentStep: 'profile', payload: {} });
    const r = await svc.patchOnboarding('u1', 'in_progress', 'profile', { profile: {} });
    expect(r.status).toBe('in_progress');
  });
});
