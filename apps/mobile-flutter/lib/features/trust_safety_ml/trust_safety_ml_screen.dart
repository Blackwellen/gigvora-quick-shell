// Domain 71 — Trust & Safety / ML mobile screen (KPI strip, insights, queues, claim FAB).
import 'package:flutter/material.dart';
import 'trust_safety_ml_api.dart';

class TrustSafetyMlScreen extends StatefulWidget {
  const TrustSafetyMlScreen({super.key, required this.api});
  final TrustSafetyMlApi api;
  @override
  State<TrustSafetyMlScreen> createState() => _TrustSafetyMlScreenState();
}

class _TrustSafetyMlScreenState extends State<TrustSafetyMlScreen> {
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
        content: Text(r['claimed'] == null ? 'No cases waiting.' : 'Claimed ${r['claimed']['reference']}'),
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
    final risk = (overview?['riskScore'] as Map<String, dynamic>?) ?? const {};
    final insights = (overview?['insights'] as List?) ?? const [];
    final queues = (overview?['queues'] as Map<String, dynamic>?) ?? const {};
    final review = (queues['review'] as List?) ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Trust & Safety'), actions: [
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
                      _kpi('Desk risk', '${risk['score'] ?? '-'} (${risk['band'] ?? '-'})'),
                      _kpi('SLA breached', '${kpis['slaBreached'] ?? 0}'),
                      _kpi('Open signals', '${kpis['signalsOpen'] ?? 0}'),
                      _kpi('Critical signals', '${(kpis['signalsByBand'] as Map?)?['critical'] ?? 0}'),
                    ]),
                    const SizedBox(height: 12),
                    ...insights.map((i) => Card(child: ListTile(
                          leading: const Icon(Icons.shield_moon_outlined),
                          title: Text((i as Map)['title']?.toString() ?? ''),
                          subtitle: Text(i['severity']?.toString() ?? ''),
                        ))),
                    const SizedBox(height: 12),
                    const Text('Review queue', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...review.map((c) {
                      final m = c as Map<String, dynamic>;
                      return Card(child: ListTile(
                        title: Text('${m['reference']} · ${m['case_kind']}'),
                        subtitle: Text('${m['subject_kind']}/${m['subject_id']} · risk ${m['risk_score']} (${m['risk_band']})'),
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
