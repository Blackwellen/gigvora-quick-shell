/**
 * Drop-in "Webhooks" tab every domain workbench mounts. Lists subscriptions,
 * shows recent deliveries with status badges, and exposes Replay + Rotate
 * Secret actions. No per-domain duplication.
 */
import { useState } from 'react';
import { useDomainWebhookTab } from '@/hooks/useWebhooks';
import type { WebhookEvent } from '@gigvora/sdk/webhooks';

export function DomainWebhooksTab({ domain, events, tenantId = 'tenant-demo' }: {
  domain: string;
  events: WebhookEvent[];
  tenantId?: string;
}) {
  const { subs, deliveries, create, rotate, deactivate, replay, catalog } = useDomainWebhookTab({ tenantId, events });
  const [url, setUrl] = useState('');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Outbound webhook subscriptions — {domain}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Events emitted: {catalog.join(', ')}. Signed with HMAC-SHA256, retried up to 5×, replayable from this panel.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your.endpoint/webhook"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={() => { if (url) { create.mutate({ tenantId, url, events }); setUrl(''); } }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >Subscribe</button>
        </div>
        <ul className="mt-3 space-y-2">
          {(subs.data ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
              <div className="truncate"><span className="font-medium">{s.url}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.active ? 'active' : 'paused'}</span></div>
              <div className="flex gap-2">
                <button onClick={() => rotate.mutate(s.id)} className="text-xs text-primary">Rotate secret</button>
                <button onClick={() => deactivate.mutate(s.id)} className="text-xs text-destructive">Deactivate</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Recent deliveries</h3>
        <table className="mt-3 w-full text-xs">
          <thead className="text-left text-muted-foreground">
            <tr><th>Event</th><th>Entity</th><th>Status</th><th>HTTP</th><th>Attempt</th><th></th></tr>
          </thead>
          <tbody>
            {(deliveries.data ?? []).slice(0, 25).map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="py-1.5">{d.event}</td>
                <td>{d.entityId.slice(0, 8)}</td>
                <td><span className={
                  d.status === 'success' ? 'text-emerald-600' :
                  d.status === 'dlq' ? 'text-destructive' : 'text-amber-600'
                }>{d.status}</span></td>
                <td>{d.httpCode ?? '—'}</td>
                <td>{d.attempt}</td>
                <td><button onClick={() => replay.mutate(d.id)} className="text-primary">Replay</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
