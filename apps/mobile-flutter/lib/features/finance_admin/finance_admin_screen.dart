// Domain 68 — Finance Admin mobile dashboard (KPI strip, insights, refund list, FAB).
import 'package:flutter/material.dart';
import 'finance_admin_api.dart';

class FinanceAdminScreen extends StatefulWidget {
  const FinanceAdminScreen({super.key, required this.api});
  final FinanceAdminApi api;
  @override
  State<FinanceAdminScreen> createState() => _FinanceAdminScreenState();
}

class _FinanceAdminScreenState extends State<FinanceAdminScreen> {
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
    final risk = (overview?['riskScore'] as Map<String, dynamic>?) ?? const {};
    final insights = (overview?['insights'] as List?) ?? const [];
    final recent = (overview?['recentRefunds'] as List?) ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Finance Admin'), actions: [
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
                      _kpi('Risk', '${risk['score'] ?? '-'} (${risk['band'] ?? '-'})'),
                      _kpi('Pending refunds', '${(kpis['refunds'] as Map?)?['pending']?['count'] ?? 0}'),
                      _kpi('Active holds', '${(kpis['holds'] as Map?)?['active']?['count'] ?? 0}'),
                    ]),
                    const SizedBox(height: 12),
                    ...insights.map((i) => Card(child: ListTile(
                          leading: const Icon(Icons.info_outline),
                          title: Text((i as Map)['title']?.toString() ?? ''),
                          subtitle: Text(i['severity']?.toString() ?? ''),
                        ))),
                    const SizedBox(height: 12),
                    const Text('Recent refunds', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...recent.map((t) {
                      final m = t as Map<String, dynamic>;
                      return Card(child: ListTile(
                        title: Text('${m['reference']} · £${(m['amount_minor'] / 100).toStringAsFixed(2)}'),
                        subtitle: Text('${m['category']} · ${m['status']}'),
                        trailing: Text(m['provider']?.toString() ?? ''),
                      ));
                    }),
                  ]),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Refresh'),
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
