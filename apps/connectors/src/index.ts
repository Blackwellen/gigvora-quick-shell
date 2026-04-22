/**
 * Enterprise connector framework.
 * Connectors implement bidirectional sync (pull/push), reconciliation, audit, retry.
 * Targets: HubSpot, Salesforce, Notion, Slack, Workday, Greenhouse, Lever, Ashby, Webhooks, generic API.
 */
export interface ConnectorRunContext {
  connectionId: string;
  cursor?: string;
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface Connector<Cfg = unknown> {
  id: string;
  name: string;
  configSchema: Cfg;
  pull?(ctx: ConnectorRunContext): Promise<{ records: unknown[]; cursor?: string }>;
  push?(ctx: ConnectorRunContext, records: unknown[]): Promise<{ ok: number; failed: number }>;
}

const registry = new Map<string, Connector>();
export const registerConnector = (c: Connector) => registry.set(c.id, c);
export const listConnectors = () => [...registry.values()];

/** Built-in stubs — implement per provider. */
['hubspot','salesforce','notion','slack','workday','greenhouse','lever','ashby','webhook','generic-rest']
  .forEach((id) => registerConnector({
    id, name: id, configSchema: {},
    async pull() { return { records: [] }; },
    async push() { return { ok: 0, failed: 0 }; },
  }));
