// Domain 67 — Customer Service mobile screens (touch-friendly stacked cards + FAB).
import 'package:flutter/material.dart';
import 'customer_service_api.dart';

class CsDashboardScreen extends StatefulWidget {
  const CsDashboardScreen({super.key, required this.api});
  final CsApi api;
  @override
  State<CsDashboardScreen> createState() => _CsDashboardScreenState();
}

class _CsDashboardScreenState extends State<CsDashboardScreen> {
  Map<String, dynamic>? overview;
  bool loading = true;
  String? error;

  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try { overview = await widget.api.overview(); }
    catch (e) { error = e.toString(); }
    finally { if (mounted) setState(() => loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (overview?['kpis'] as Map<String, dynamic>?) ?? const {};
    final insights = (overview?['insights'] as List?) ?? const [];
    final recent = (overview?['recent'] as List?) ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Customer Service'), actions: [
        IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
      ]),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Center(child: Text('Error: $error'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(12), children: [
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      _kpi('Breaches', '${kpis['breaches'] ?? 0}'),
                      _kpi('Urgent', '${(kpis['byPriority'] as Map?)?['urgent'] ?? 0}'),
                      _kpi('Pending', '${(kpis['byStatus'] as Map?)?['pending'] ?? 0}'),
                    ]),
                    const SizedBox(height: 12),
                    ...insights.map((i) => Card(child: ListTile(
                          leading: const Icon(Icons.info_outline),
                          title: Text((i as Map)['title']?.toString() ?? ''),
                          subtitle: Text(i['severity']?.toString() ?? ''),
                        ))),
                    const SizedBox(height: 12),
                    const Text('Recent tickets', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...recent.map((t) {
                      final m = t as Map<String, dynamic>;
                      return Card(child: ListTile(
                        title: Text(m['subject']?.toString() ?? ''),
                        subtitle: Text('${m['reference']} · ${m['priority']} · ${m['status']}'),
                        trailing: Text(m['queue_slug']?.toString() ?? ''),
                      ));
                    }),
                  ]),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _load, icon: const Icon(Icons.add), label: const Text('New Ticket'),
      ),
    );
  }

  Widget _kpi(String label, String value) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(border: Border.all(), borderRadius: BorderRadius.circular(12)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ]),
      );
}
