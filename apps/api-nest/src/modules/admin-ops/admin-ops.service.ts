import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminOpsRepository } from './admin-ops.repository';

type Entity = 'company' | 'user' | 'mentor';
type Meta = { ip?: string; userAgent?: string };

const ROLE_READ  = ['admin_ops','super_admin','operator','viewer','trust_safety_admin'];
const ROLE_WRITE = ['admin_ops','super_admin'];

const STATUS_FOR_ACTION: Record<Entity, Record<string, string>> = {
  company: { suspend: 'suspended', reinstate: 'active', archive: 'archived', watch: 'watch' },
  user:    { suspend: 'suspended', reinstate: 'active', archive: 'archived', watch: 'watch' },
  mentor:  { suspend: 'suspended', reinstate: 'active', archive: 'archived' },
};

@Injectable()
export class AdminOpsService {
  constructor(private readonly repo: AdminOpsRepository) {}

  private assertRead(role: string)  { if (!ROLE_READ.includes(role))  throw new ForbiddenException({ code: 'admin_ops_read_required' }); }
  private assertWrite(role: string) { if (!ROLE_WRITE.includes(role)) throw new ForbiddenException({ code: 'admin_ops_write_required' }); }

  list(role: string, entity: Entity, filter: any) {
    this.assertRead(role);
    return this.repo.list(entity, filter).then((r) => ({
      ...r, meta: { source: 'admin-ops', role, entity, page: filter.page, pageSize: filter.pageSize },
    }));
  }
  async detail(role: string, entity: Entity, id: string) {
    this.assertRead(role);
    const row = await this.repo.byId(entity, id);
    if (!row) throw new NotFoundException({ code: 'not_found' });
    const audit = await this.repo.auditList(entity, id);
    return { row, audit };
  }

  async upsert(role: string, actor: string, entity: Entity, dto: any, meta: Meta) {
    this.assertWrite(role);
    const before = dto.id ? await this.repo.byId(entity, dto.id) : null;
    const after = entity === 'company' ? await this.repo.upsertCompany(dto)
                : entity === 'user'    ? await this.repo.upsertUser(dto)
                                       : await this.repo.upsertMentor(dto);
    await this.repo.audit(entity, after.id, actor, before ? 'update' : 'create', before, after, meta.ip, meta.userAgent);
    return after;
  }

  async bulkAct(role: string, actor: string, dto: { entity: Entity; ids: string[]; action: string; note?: string }, meta: Meta) {
    this.assertWrite(role);
    const out: { id: string; ok: boolean; status?: string; error?: string }[] = [];
    for (const id of dto.ids) {
      try {
        const before = await this.repo.byId(dto.entity, id);
        if (!before) { out.push({ id, ok: false, error: 'not_found' }); continue; }
        let after: any;
        if (dto.entity === 'company' && (dto.action === 'verify' || dto.action === 'reject')) {
          after = await this.repo.setVerification(id, dto.action === 'verify' ? 'verified' : 'rejected');
        } else {
          const next = STATUS_FOR_ACTION[dto.entity][dto.action];
          if (!next) { out.push({ id, ok: false, error: 'bad_action' }); continue; }
          after = await this.repo.setStatus(dto.entity, id, next);
        }
        await this.repo.audit(dto.entity, id, actor, `bulk.${dto.action}`, before, after, meta.ip, meta.userAgent);
        out.push({ id, ok: true, status: after.status ?? after.verification });
      } catch (e: any) {
        out.push({ id, ok: false, error: e?.message ?? 'failed' });
      }
    }
    return { results: out, count: out.length };
  }
}
