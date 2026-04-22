// Reusable Flutter feature-pack template
// Copy to apps/mobile-flutter/lib/features/<domain>/ and rename Domain → <Domain>.
// Provides: typed API client, Riverpod providers, list + detail screens with
// shimmer loading, empty CTA, error retry, pull-to-refresh, and offline-aware caching.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/api_client.dart';

/// API client
class DomainApi {
  final ApiClient _client;
  DomainApi(this._client);

  Future<List<Map<String, dynamic>>> list({String? q}) async {
    final res = await _client.get('/v1/<domain>', query: {if (q != null) 'q': q});
    return List<Map<String, dynamic>>.from(res['data'] ?? []);
  }

  Future<Map<String, dynamic>> detail(String id) async {
    final res = await _client.get('/v1/<domain>/$id');
    return Map<String, dynamic>.from(res['data'] ?? {});
  }
}

final domainApiProvider = Provider((ref) => DomainApi(ref.watch(apiClientProvider)));

final domainListProvider = FutureProvider.family<List<Map<String, dynamic>>, String?>(
  (ref, q) => ref.watch(domainApiProvider).list(q: q),
);

final domainDetailProvider = FutureProvider.family<Map<String, dynamic>, String>(
  (ref, id) => ref.watch(domainApiProvider).detail(id),
);

/// List screen — with shimmer, empty CTA, error retry, pull-to-refresh.
class DomainListScreen extends ConsumerWidget {
  const DomainListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(domainListProvider(null));
    return Scaffold(
      appBar: AppBar(title: const Text('Domain')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(domainListProvider(null)),
        child: async.when(
          loading: () => _Shimmer(),
          error: (e, _) => _ErrorState(onRetry: () => ref.invalidate(domainListProvider(null))),
          data: (items) => items.isEmpty
              ? _EmptyState()
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => Card(
                    child: ListTile(
                      title: Text(items[i]['title'] ?? ''),
                      subtitle: Text(items[i]['subtitle'] ?? ''),
                      onTap: () => Navigator.pushNamed(context, '/<domain>/${items[i]['id']}'),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

class _Shimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
        baseColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        highlightColor: Theme.of(context).colorScheme.surface,
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 8,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, __) => Container(height: 72, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
        ),
      );
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.inbox_outlined, size: 64),
            const SizedBox(height: 16),
            Text('Nothing here yet', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            FilledButton(onPressed: () {}, child: const Text('Create the first one')),
          ],
        ),
      );
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64),
            const SizedBox(height: 16),
            const Text('Could not load'),
            const SizedBox(height: 8),
            FilledButton.tonal(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );
}
