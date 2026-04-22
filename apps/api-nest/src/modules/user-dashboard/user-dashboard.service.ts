import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { UserDashboardRepository } from './user-dashboard.repository';
import {
  CreateActionDto, UpdateActionDto, UpsertWidgetDto, ReorderWidgetsDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const SNAPSHOT_TTL_SECONDS = 60;

@Injectable()
export class UserDashboardService {
  private readonly logger = new Logger(UserDashboardService.name);

  constructor(private readonly repo: UserDashboardRepository) {}

  // ---- Overview (cached snapshot + analytics enrichment with deterministic fallback)
  async overview(userId: string, role: string, refresh = false) {
    const widgets = await this.repo.listWidgets(userId, role);
    let snapshot = refresh ? null : await this.repo.getLatestSnapshot(userId, role);
    const stale = snapshot?.staleAt ? new Date(snapshot.staleAt).getTime() < Date.now() : true;

    if (!snapshot || stale) {
      const payload = await this.computeOverviewPayload(userId, role);
      snapshot = await this.repo.writeSnapshot(userId, role, payload, SNAPSHOT_TTL_SECONDS);
    }

    const actions = await this.repo.listActions(userId, role, 'pending');
    return {
      role,
      widgets,
      kpis: snapshot.payload?.kpis ?? this.fallbackKpis(role),
      insights: snapshot.payload?.insights ?? [],
      activity: snapshot.payload?.activity ?? [],
      nextActions: actions.slice(0, 8),
      computedAt: snapshot.computedAt,
      staleAt: snapshot.staleAt,
    };
  }

  private async computeOverviewPayload(userId: string, role: string) {
    // Try analytics enrichment; fall back to deterministic stub.
    try {
      const res = await fetch(`${ANALYTICS_BASE}/user-dashboard/overview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      this.logger.warn(`analytics overview unavailable, using fallback: ${(e as Error).message}`);
    }
    return {
      kpis: this.fallbackKpis(role),
      insights: this.fallbackInsights(role),
      activity: [],
    };
  }

  private fallbackKpis(role: string) {
    if (role === 'professional') {
      return { activeOrders: 0, earningsMtd: 0, responseRateP90: 0.95, openOpportunities: 0 };
    }
    if (role === 'enterprise') {
      return { openReqs: 0, spendMtd: 0, vendorsActive: 0, pendingApprovals: 0 };
    }
    return { savedItems: 0, ordersOpen: 0, bookingsUpcoming: 0, unreadMessages: 0 };
  }

  private fallbackInsights(role: string) {
    return [{
      id: 'welcome',
      severity: 'info',
      title: role === 'professional' ? 'Optimise your offers' : role === 'enterprise' ? 'Set up procurement workspace' : 'Pick up where you left off',
      body: 'Live signals will appear once the analytics service is reachable.',
    }];
  }

  // ---- Widgets
  async listWidgets(userId: string, role: string) {
    return this.repo.listWidgets(userId, role);
  }

  async upsertWidget(userId: string, dto: UpsertWidgetDto) {
    const row = await this.repo.upsertWidget(userId, dto);
    await this.repo.recordEvent(userId, 'dashboard.widget.upsert', { widgetKey: dto.widgetKey });
    return row;
  }

  async reorderWidgets(userId: string, dto: ReorderWidgetsDto) {
    return this.repo.reorderWidgets(userId, dto.role, dto.order);
  }

  async deleteWidget(userId: string, id: string) {
    return this.repo.deleteWidget(userId, id);
  }

  // ---- Actions (next-best-action queue)
  async listActions(userId: string, role: string, status?: string) {
    return this.repo.listActions(userId, role, status);
  }

  async createAction(userId: string, dto: CreateActionDto) {
    const row = await this.repo.createAction(userId, dto);
    await this.repo.recordEvent(userId, 'dashboard.action.create', { kind: dto.kind });
    return row;
  }

  async updateAction(userId: string, id: string, dto: UpdateActionDto) {
    if (dto.status === 'snoozed' && !dto.snoozeUntil) {
      throw new ForbiddenException('snoozeUntil required when snoozing');
    }
    const row = await this.repo.updateAction(userId, id, dto);
    if (!row) throw new NotFoundException('action not found');
    await this.repo.recordEvent(userId, `dashboard.action.${dto.status ?? 'update'}`, { id });
    return row;
  }

  async completeAction(userId: string, id: string) {
    return this.updateAction(userId, id, { status: 'done' } as UpdateActionDto);
  }

  async dismissAction(userId: string, id: string) {
    return this.updateAction(userId, id, { status: 'dismissed' } as UpdateActionDto);
  }
}
