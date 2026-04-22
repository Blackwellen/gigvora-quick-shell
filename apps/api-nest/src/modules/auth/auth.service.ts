import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { D1Emit } from '../domain-bus/domain-emissions';

// NOTE: replace in-memory store with TypeORM UsersRepository when entities land.
@Injectable()
export class AuthService {
  private users = new Map<string, { id: string; email: string; passwordHash: string; name: string }>();
  private refreshTokens = new Set<string>();

  constructor(private readonly jwt: JwtService) {}

  async signup({ email, password, name }: { email: string; password: string; name: string }) {
    if (this.users.has(email)) throw new UnauthorizedException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    this.users.set(email, { id, email, passwordHash, name });
    const tokens = await this.issueTokens(id, email);
    D1Emit.signup('tenant-demo', id, { id, email, name });
    return tokens;
  }

  async login({ email, password }: { email: string; password: string }) {
    const u = this.users.get(email);
    if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(u.id, email);
    D1Emit.login('tenant-demo', u.id, { id: u.id, email });
    return tokens;
  }

  async refresh(token: string) {
    if (!this.refreshTokens.has(token)) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync(token);
      this.refreshTokens.delete(token);
      const tokens = await this.issueTokens(payload.sub, payload.email);
      D1Emit.refresh('tenant-demo', payload.sub, { id: payload.sub, email: payload.email });
      return tokens;
    } catch {
      throw new UnauthorizedException();
    }
  }

  async logout(token: string) {
    this.refreshTokens.delete(token);
    try {
      const payload: any = await this.jwt.verifyAsync(token);
      D1Emit.logout('tenant-demo', payload.sub, { id: payload.sub, email: payload.email });
    } catch { /* token already invalid — still ok */ }
    return { ok: true };
  }

  private async issueTokens(sub: string, email: string) {
    const access  = await this.jwt.signAsync({ sub, email }, { expiresIn: '15m' });
    const refresh = await this.jwt.signAsync({ sub, email }, { expiresIn: '30d' });
    this.refreshTokens.add(refresh);
    return { accessToken: access, refreshToken: refresh, user: { id: sub, email } };
  }
}
