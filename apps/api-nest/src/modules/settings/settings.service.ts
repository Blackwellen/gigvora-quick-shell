import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { AuditService } from '../workspace/audit.service';
import { D4Emit } from '../domain-bus/domain-emissions';
import type { BulkUpsertSettingsDto, CreateConnectedAccountDto, CreateDataRequestDto, ResetNamespaceDto, SettingNamespace, UpsertSettingDto } from './dto';

function envelope<T>(items: T[], limit?: number) {
  const lim = limit ?? items.length;
  return { items, total: items.length, limit: lim, hasMore: limit != null && items.length >= lim };
}

/**
 * Service-level business rules. Validates per-key value shapes (theme is one of
 * a known enum; font_scale is between 0.75 and 2.0; etc.) before persisting.
 */
@Injectable()
export class SettingsService {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly audit: AuditService,
  ) {}

  // ---------- settings ----------
  async list(identityId: string, namespace?: SettingNamespace) {
    const items = await this.repo.list(identityId, namespace);
    return envelope(items);
  }
  getOne(identityId: string, namespace: string, key: string) {
    return this.repo.getOne(identityId, namespace, key);
  }
  async upsert(identityId: string, dto: UpsertSettingDto) {
    this.validateValue(dto);
    const r = await this.repo.upsert(identityId, identityId, dto);
    await this.audit.record({
      actorId: identityId, domain: 'settings', action: 'setting.upsert',
      targetType: 'setting', targetId: `${dto.namespace}.${dto.key}`,
      meta: { namespace: dto.namespace, key: dto.key, scope: dto.scope ?? 'user' },
    });
    D4Emit.upserted('tenant-demo', `${dto.namespace}.${dto.key}`, { identityId, namespace: dto.namespace, key: dto.key, scope: dto.scope ?? 'user' });
    return r;
  }
  async bulkUpsert(identityId: string, dto: BulkUpsertSettingsDto) {
    const out = [];
    for (const item of dto.items) {
      this.validateValue(item);
      out.push(await this.repo.upsert(identityId, identityId, item));
    }
    await this.audit.record({
      actorId: identityId, domain: 'settings', action: 'setting.bulkUpsert',
      targetType: 'setting', meta: { count: out.length },
    });
    D4Emit.bulkUpserted('tenant-demo', identityId, { identityId, count: out.length, keys: dto.items.map((i) => `${i.namespace}.${i.key}`) });
    return { updated: out.length, items: out };
  }
  async resetNamespace(identityId: string, dto: ResetNamespaceDto) {
    const r = await this.repo.resetNamespace(identityId, dto.namespace);
    await this.audit.record({
      actorId: identityId, domain: 'settings', action: 'setting.reset',
      targetType: 'namespace', targetId: dto.namespace,
    });
    D4Emit.namespaceReset('tenant-demo', `${identityId}:${dto.namespace}`, { identityId, namespace: dto.namespace });
    return r;
  }
  async audit_log(identityId: string, limit?: number) {
    const items = await this.repo.audit(identityId, limit);
    return envelope(items, limit);
  }

  // Public alias preserved for controller binding
  audit(identityId: string, limit?: number) { return this.audit_log(identityId, limit); }

  // ---------- catalogue ----------
  async listLocales()   { return envelope(await this.repo.listLocales()); }
  async listTimezones() { return envelope(await this.repo.listTimezones()); }

  // ---------- connected accounts ----------
  async listConnectedAccounts(identityId: string) {
    return envelope(await this.repo.listConnectedAccounts(identityId));
  }
  async createConnectedAccount(identityId: string, dto: CreateConnectedAccountDto) {
    const r = await this.repo.createConnectedAccount(identityId, dto);
    await this.audit.record({
      actorId: identityId, domain: 'settings', action: 'connection.create',
      targetType: 'connected_account', targetId: r?.id ?? dto.externalId,
      meta: { provider: dto.provider },
    });
    D4Emit.accountLinked('tenant-demo', r?.id ?? dto.externalId, { identityId, provider: dto.provider, externalId: dto.externalId, accountId: r?.id });
    return r;
  }
  async revokeConnectedAccount(identityId: string, id: string) {
    const r = await this.repo.revokeConnectedAccount(identityId, id);
    await this.audit.record({
      actorId: identityId, domain: 'settings', action: 'connection.revoke',
      targetType: 'connected_account', targetId: id,
    });
    D4Emit.accountRevoked('tenant-demo', id, { identityId, accountId: id });
    return r;
  }

  // ---------- data requests ----------
  async createDataRequest(identityId: string, dto: CreateDataRequestDto) {
    const r = await this.repo.createDataRequest(identityId, dto.kind, dto.reason);
    await this.audit.record({
      actorId: identityId, domain: 'settings', action: 'data_request.create',
      targetType: 'data_request', targetId: r?.id, meta: { kind: dto.kind },
    });
    D4Emit.dataRequest('tenant-demo', r?.id ?? `${identityId}:${dto.kind}`, { identityId, kind: dto.kind, reason: dto.reason, requestId: r?.id });
    return r;
  }
  async listDataRequests(identityId: string) {
    return envelope(await this.repo.listDataRequests(identityId));
  }

  // ---------- validation ----------
  private validateValue(dto: UpsertSettingDto): void {
    const bad = (msg: string) => { throw new BadRequestException(`invalid setting ${dto.namespace}.${dto.key}: ${msg}`); };
    const v = dto.value as unknown;
    switch (`${dto.namespace}.${dto.key}`) {
      case 'general.theme':
        if (!['light','dark','system'].includes(v as string)) bad('expected light|dark|system');
        return;
      case 'general.density':
        if (!['compact','comfortable','spacious'].includes(v as string)) bad('expected compact|comfortable|spacious');
        return;
      case 'locale.language':
      case 'locale.timezone':
      case 'locale.currency':
      case 'locale.date_format':
        if (typeof v !== 'string' || !v.length) bad('expected non-empty string');
        return;
      case 'accessibility.font_scale': {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0.75 || n > 2.0) bad('expected number between 0.75 and 2.0');
        return;
      }
      case 'accessibility.reduce_motion':
      case 'accessibility.high_contrast':
      case 'accessibility.keyboard_only':
      case 'privacy.searchable_by_email':
      case 'privacy.data_sharing_marketing':
      case 'profile.show_activity_feed':
      case 'profile.show_endorsements':
        if (typeof v !== 'boolean') bad('expected boolean');
        return;
      case 'privacy.profile_visibility':
        if (!['public','connections','private'].includes(v as string)) bad('expected public|connections|private');
        return;
      default:
        // Unknown key — accept any JSON-serialisable value (forward-compat).
        return;
    }
  }
}
