/// Domain 16 — Trust list screen (mobile). Reduced parity: shows reviews list
/// and trust score header. Leave-review uses a bottom sheet.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'trust_api.dart';
import 'leave_review_sheet.dart';

class TrustListScreen extends ConsumerStatefulWidget {
  final TrustApi api;
  const TrustListScreen({super.key, required this.api});
  @override
  ConsumerState<TrustListScreen> createState() => _TrustListScreenState();
}

class _TrustListScreenState extends ConsumerState<TrustListScreen> {
  late Future<Map<String, dynamic>> _future;
  late Future<Map<String, dynamic>> _scoreFuture;

  @override
  void initState() {
    super.initState();
    _future = widget.api.listReviews();
    _scoreFuture = widget.api.score();
  }

  void _refresh() {
    setState(() {
      _future = widget.api.listReviews();
      _scoreFuture = widget.api.score();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trust & Reviews')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final created = await showModalBottomSheet<bool>(
            context: context, isScrollControlled: true,
            builder: (_) => LeaveReviewSheet(api: widget.api),
          );
          if (created == true) _refresh();
        },
        icon: const Icon(Icons.add), label: const Text('Leave review'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _refresh(),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _future,
          builder: (ctx, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snap.hasError) {
              return Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('Could not load reviews\n\n${snap.error}', textAlign: TextAlign.center)));
            }
            final items = (snap.data?['items'] as List?) ?? const [];
            if (items.isEmpty) {
              return const Center(child: Text('No reviews yet.'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return FutureBuilder<Map<String, dynamic>>(
                    future: _scoreFuture,
                    builder: (ctx, ss) {
                      final s = ss.data?['score'] as Map<String, dynamic>?;
                      final overall = s?['overall'] ?? 0;
                      final band = s?['band'] ?? 'new';
                      return Card(child: ListTile(leading: const Icon(Icons.shield), title: Text('Trust score: $overall'), subtitle: Text('Band: $band')));
                    },
                  );
                }
                final r = items[i - 1] as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    title: Text(r['title']?.toString() ?? '—'),
                    subtitle: Text(r['body']?.toString() ?? ''),
                    trailing: Text('★ ${r['rating']}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
