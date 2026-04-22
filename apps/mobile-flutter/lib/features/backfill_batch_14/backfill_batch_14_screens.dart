// Flutter wiring for backfill batch 14 — Analytics v2, Reporting, Audit Log, Webhooks, Integrations.
import 'package:flutter/material.dart';

class _DomainScreen extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  const _DomainScreen({required this.title, required this.description, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 56, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(description, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class AnalyticsV2Screen extends StatelessWidget {
  const AnalyticsV2Screen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Analytics v2',
    description: 'Event ingestion, sessions, funnels, cohorts, daily metric rollups. Backed by /api/v1/analytics.',
    icon: Icons.insights,
  );
}

class ReportingScreen extends StatelessWidget {
  const ReportingScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Reporting',
    description: 'Saved report definitions, cron-scheduled runs, multi-format exports (PDF / CSV / XLSX / JSON).',
    icon: Icons.assessment,
  );
}

class AuditLogScreen extends StatelessWidget {
  const AuditLogScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Audit Log',
    description: 'Immutable, hash-chained record of every privileged action with severity tiers and external streaming.',
    icon: Icons.fact_check,
  );
}

class WebhooksScreen extends StatelessWidget {
  const WebhooksScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Webhooks',
    description: 'Outbound webhook endpoints with HMAC signing, exponential-backoff retries, and per-event subscriptions.',
    icon: Icons.webhook,
  );
}

class IntegrationsScreen extends StatelessWidget {
  const IntegrationsScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Integrations',
    description: 'Connector registry (CRM/ATS/comms/storage/AI), OAuth + API-key vault, sync run history.',
    icon: Icons.extension,
  );
}
