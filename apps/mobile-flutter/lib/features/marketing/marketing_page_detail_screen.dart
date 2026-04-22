import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/async_state.dart';
import 'marketing_providers.dart';
import 'lead_capture_sheet.dart';

class MarketingPageDetailScreen extends ConsumerWidget {
  final String slug;
  const MarketingPageDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(marketingPageProvider(slug));
    return Scaffold(
      appBar: AppBar(title: Text(slug)),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        onRetry: () => ref.invalidate(marketingPageProvider(slug)),
        builder: (p) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(p['title']?.toString() ?? '—',
                style: Theme.of(context).textTheme.headlineSmall),
            if ((p['tagline'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(p['tagline'].toString(),
                  style: Theme.of(context).textTheme.titleMedium),
            ],
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              Chip(label: Text(p['surface']?.toString() ?? '—')),
              Chip(label: Text(p['status']?.toString() ?? '—')),
              Chip(label: Text(p['locale']?.toString() ?? '—')),
            ]),
            const SizedBox(height: 16),
            if ((p['description'] ?? '').toString().isNotEmpty)
              Text(p['description'].toString()),
            const SizedBox(height: 24),
            FilledButton.icon(
              icon: const Icon(Icons.send),
              label: const Text('Talk to sales'),
              onPressed: () => showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                builder: (_) => LeadCaptureSheet(sourcePage: slug, sourceCta: 'detail_cta'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
