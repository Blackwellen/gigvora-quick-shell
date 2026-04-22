// Flutter wiring for backfill batch 13 — Billing & Invoices, Tax & Compliance, File Storage.
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

class BillingInvoicesScreen extends StatelessWidget {
  const BillingInvoicesScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Billing & Invoices',
    description: 'Invoices, line items, payments, recurring subscriptions, and credit notes. Backed by /api/v1/billing.',
    icon: Icons.receipt_long,
  );
}

class TaxComplianceScreen extends StatelessWidget {
  const TaxComplianceScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Tax & Compliance',
    description: 'VAT/sales-tax rates, registrations, exemption certificates, W-9 collection, and 1099 filings.',
    icon: Icons.gavel,
  );
}

class FileStorageScreen extends StatelessWidget {
  const FileStorageScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'File Storage',
    description: 'S3/R2 abstraction with multipart uploads, signed URLs, virus scanning, and per-tenant quotas.',
    icon: Icons.cloud,
  );
}
