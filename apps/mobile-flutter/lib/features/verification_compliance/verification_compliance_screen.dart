// Domain 73 — Verification & Compliance mobile screen (KPI strip, insights, queues, claim FAB).
import 'package:flutter/material.dart';
import 'verification_compliance_api.dart';

class VerificationComplianceScreen extends StatefulWidget {
  const VerificationComplianceScreen({super.key, required this.api});
  final VerificationComplianceApi api;
  @override
  State<VerificationComplianceScreen> createState() => _VerificationComplianceScreenState();
}

class _VerificationComplianceScreenState extends State<VerificationComplianceScreen> {
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
        content: Text(r['claimed'] == null ? 'No verification cases waiting.' : 'Claimed ${r['claimed']['reference']}'),
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
    final desk = (overview?['deskRisk'] as Map<String, dynamic>?) ?? const {};
    final queues = (overview?['queues'] as Map<String, dynamic>?) ?? const {};
    final review = (queues['review'] as List?) ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Verification & Compliance'), actions: [
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
                      _kpi('Critical', '${(kpis['casesByBand'] as Map?)?['critical'] ?? 0}'),
                      _kpi('Triage', '${(kpis['casesByQueue'] as Map?)?['triage'] ?? 0}'),
                      _kpi('Expiring 30d', '${kpis['expiringSoon'] ?? 0}'),
                      _kpi('Watchlist', '${kpis['watchlist'] ?? 0}'),
                      _kpi('Desk risk', '${desk['score'] ?? 0} (${desk['band'] ?? 'normal'})'),
                    ]),
                    const SizedBox(height: 12),
                    ...insights.map((i) => Card(child: ListTile(
                          leading: const Icon(Icons.verified_user_outlined),
                          title: Text((i as Map)['title']?.toString() ?? ''),
                          subtitle: Text(i['severity']?.toString() ?? ''),
                        ))),
                    const SizedBox(height: 12),
                    const Text('Review queue', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...review.map((c) {
                      final m = c as Map<String, dynamic>;
                      return Card(child: ListTile(
                        title: Text('${m['reference']} · ${m['program']}'),
                        subtitle: Text('${m['subject_kind']} · score ${m['risk_score']} (${m['risk_band']})'),
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
