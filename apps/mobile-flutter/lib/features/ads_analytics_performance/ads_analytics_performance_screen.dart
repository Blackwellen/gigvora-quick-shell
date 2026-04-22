import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'ads_analytics_performance_api.dart';

/// Domain 61 — Ads Analytics & Creative Performance mobile screen.
///
/// Mobile affordances:
///   • Sticky KPI header (Spend / CTR / CPC / ROAS).
///   • Tabs: Insights | Alerts | Anomalies.
///   • Tap an alert/anomaly → bottom sheet with acknowledge/resolve.
class AdsAnalyticsPerformanceScreen extends ConsumerStatefulWidget {
  const AdsAnalyticsPerformanceScreen({super.key});
  @override
  ConsumerState<AdsAnalyticsPerformanceScreen> createState() => _State();
}

class _State extends ConsumerState<AdsAnalyticsPerformanceScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _alerts = const [];
  List<dynamic> _anomalies = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = AdsAnalyticsPerformanceApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _alerts = await api.alerts();
      _anomalies = await api.anomalies(status: 'open');
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _ackAnomaly(String id) async {
    final api = AdsAnalyticsPerformanceApi(ref.read(apiClientProvider));
    await api.transitionAnomaly(id, 'acknowledged');
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (_overview?['kpis'] as Map?) ?? const {};
    final insights = (_overview?['insights'] as List?) ?? const [];
    return DefaultTabController(length: 3, child: Scaffold(
      appBar: AppBar(title: const Text('Ads Analytics'), bottom: const TabBar(tabs: [
        Tab(text: 'Insights'), Tab(text: 'Alerts'), Tab(text: 'Anomalies'),
      ])),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Text('Error: $_error'))
          : Column(children: [
              Container(margin: const EdgeInsets.all(16), padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
                child: Row(children: [
                  Expanded(child: _stat('Spend', '£${((kpis['spend_minor'] ?? 0) as num)/100}')),
                  Expanded(child: _stat('CTR', '${((kpis['ctr'] ?? 0) as num)*100}%')),
                  Expanded(child: _stat('CPC', '£${((kpis['cpc_minor'] ?? 0) as num)/100}')),
                  Expanded(child: _stat('ROAS', '${((kpis['roas'] ?? 0) as num).toStringAsFixed(2)}×')),
                ])),
              Expanded(child: TabBarView(children: [
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: insights.map((i) {
                  final m = Map<String, dynamic>.from(i as Map);
                  return ListTile(
                    leading: Icon(_iconFor(m['severity']?.toString())),
                    title: Text(m['title']?.toString() ?? ''),
                    subtitle: m['body'] != null ? Text(m['body'].toString()) : null);
                }).toList())),
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _alerts.map((a) {
                  final m = Map<String, dynamic>.from(a as Map);
                  return ListTile(title: Text(m['name']?.toString() ?? ''),
                    subtitle: Text('${m['metric']} ${m['comparator']} ${m['threshold']} • ${m['status']}'),
                    trailing: const Icon(Icons.notifications_outlined));
                }).toList())),
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _anomalies.map((a) {
                  final m = Map<String, dynamic>.from(a as Map);
                  return ListTile(title: Text('${m['metric']} • z=${(m['zscore'] as num).toStringAsFixed(2)}'),
                    subtitle: Text(m['rationale']?.toString() ?? ''),
                    trailing: TextButton(onPressed: () => _ackAnomaly(m['id'] as String), child: const Text('Ack')));
                }).toList())),
              ])),
            ]),
    ));
  }

  IconData _iconFor(String? sev) {
    switch (sev) {
      case 'success': return Icons.check_circle_outline;
      case 'warn': return Icons.warning_amber_outlined;
      case 'critical': return Icons.error_outline;
      default: return Icons.info_outline;
    }
  }

  Widget _stat(String l, String v) => Column(children: [
    Text(l, style: const TextStyle(fontSize: 12, color: Colors.black54)),
    const SizedBox(height: 4),
    Text(v, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
  ]);
}
