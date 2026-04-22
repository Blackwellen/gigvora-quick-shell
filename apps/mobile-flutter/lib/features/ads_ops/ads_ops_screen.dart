// Domain 72 — Ads Ops mobile screen (KPI strip, insights, queues, claim FAB).
import 'package:flutter/material.dart';
import 'ads_ops_api.dart';

class AdsOpsScreen extends StatefulWidget {
  const AdsOpsScreen({super.key, required this.api});
  final AdsOpsApi api;
  @override
  State<AdsOpsScreen> createState() => _AdsOpsScreenState();
}

class _AdsOpsScreenState extends State<AdsOpsScreen> {
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
  Future<void> _claim() async {
    try {
      final r = await widget.api.claimNext(queue: 'triage');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(r['claimed'] == null ? 'No reviews waiting.' : 'Claimed ${r['claimed']['reference']}'),
      ));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Claim failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (overview?['kpis'] as Map<String, dynamic>?) ?? const {};
    final insights = (overview?['insights'] as List?) ?? const [];
    final queues = (overview?['queues'] as Map<String, dynamic>?) ?? const {};
    final review = (queues['review'] as List?) ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Ads Ops'), actions: [
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
                      _kpi('SLA breached', '${kpis['slaBreached'] ?? 0}'),
                      _kpi('Critical', '${(kpis['reviewsByBand'] as Map?)?['critical'] ?? 0}'),
                      _kpi('Triage', '${(kpis['reviewsByQueue'] as Map?)?['triage'] ?? 0}'),
                      _kpi('Geo rules', '${kpis['geoRules'] ?? 0}'),
                      _kpi('KW rules', '${kpis['keywordRules'] ?? 0}'),
                    ]),
                    const SizedBox(height: 12),
                    ...insights.map((i) => Card(child: ListTile(
                          leading: const Icon(Icons.policy_outlined),
                          title: Text((i as Map)['title']?.toString() ?? ''),
                          subtitle: Text(i['severity']?.toString() ?? ''),
                        ))),
                    const SizedBox(height: 12),
                    const Text('Review queue', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...review.map((c) {
                      final m = c as Map<String, dynamic>;
                      return Card(child: ListTile(
                        title: Text('${m['reference']} · ${m['creative_kind']}'),
                        subtitle: Text('${m['advertiser_id']} · score ${m['policy_score']} (${m['policy_band']})'),
                        trailing: Text(m['status']?.toString() ?? ''),
                      ));
                    }),
                  ]),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _claim, icon: const Icon(Icons.flash_on), label: const Text('Claim next'),
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
