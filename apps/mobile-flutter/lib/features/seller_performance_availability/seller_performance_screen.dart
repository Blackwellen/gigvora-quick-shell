import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'seller_performance_api.dart';

/// Mobile parity for Seller Availability Center.
/// Compact stacked cards; pause/resume via swipe + bottom-sheet for vacation.
class SellerPerformanceScreen extends ConsumerStatefulWidget {
  const SellerPerformanceScreen({super.key, required this.sellerId});
  final String sellerId;

  @override
  ConsumerState<SellerPerformanceScreen> createState() => _State();
}

class _State extends ConsumerState<SellerPerformanceScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    try {
      final d = await ref.read(sellerPerformanceApiProvider).overview(widget.sellerId);
      setState(() => _data = d);
    } catch (_) {
      setState(() => _data = {'capacity': [], 'optimizations': []});
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _vacationSheet() async {
    await showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Schedule vacation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () async {
              final today = DateTime.now();
              await ref.read(sellerPerformanceApiProvider).scheduleVacation(
                widget.sellerId,
                today.toIso8601String().substring(0, 10),
                today.add(const Duration(days: 7)).toIso8601String().substring(0, 10),
                'Back next week',
              );
              if (mounted) Navigator.pop(context);
              _refresh();
            },
            child: const Text('Schedule 7-day vacation'),
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final caps = (_data?['capacity'] as List?) ?? [];
    final opts = (_data?['optimizations'] as List?) ?? [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Availability Center'),
        actions: [
          IconButton(icon: const Icon(Icons.beach_access), onPressed: _vacationSheet),
          IconButton(
            icon: const Icon(Icons.pause_circle),
            onPressed: () async {
              await ref.read(sellerPerformanceApiProvider).pauseAll(widget.sellerId);
              _refresh();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(children: [
                ...caps.map((c) {
                  final m = Map<String, dynamic>.from(c as Map);
                  return Dismissible(
                    key: ValueKey(m['id']),
                    direction: DismissDirection.endToStart,
                    background: Container(color: Colors.orange, alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 16), child: const Icon(Icons.pause)),
                    onDismissed: (_) async {
                      await ref.read(sellerPerformanceApiProvider).setGigStatus(
                        widget.sellerId, m['gig_id'] as String,
                        m['status'] == 'active' ? 'paused' : 'active');
                      _refresh();
                    },
                    child: ListTile(
                      title: Text('Gig ${m['gig_id']}'),
                      subtitle: Text('Queue ${m['queue_depth']}/${m['max_queue']} • ${m['status']}'),
                    ),
                  );
                }),
                if (opts.isNotEmpty) const Divider(),
                ...opts.map((o) {
                  final m = Map<String, dynamic>.from(o as Map);
                  return ListTile(
                    leading: const Icon(Icons.lightbulb_outline),
                    title: Text(m['title'] ?? ''),
                    subtitle: Text(m['detail'] ?? ''),
                    trailing: TextButton(
                      child: const Text('Apply'),
                      onPressed: () async {
                        await ref.read(sellerPerformanceApiProvider)
                          .actOnOptimization(widget.sellerId, m['id'] as String, 'apply');
                        _refresh();
                      },
                    ),
                  );
                }),
              ]),
            ),
    );
  }
}
