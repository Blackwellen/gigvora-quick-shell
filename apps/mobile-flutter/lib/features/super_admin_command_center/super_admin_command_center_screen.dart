// Domain 74 — Super Admin Command Center mobile screen (KPI strip, insights, flags, incidents).
import 'package:flutter/material.dart';
import 'super_admin_command_center_api.dart';

class SuperAdminCommandCenterScreen extends StatefulWidget {
  const SuperAdminCommandCenterScreen({super.key, required this.api});
  final SuperAdminCommandCenterApi api;
  @override
  State<SuperAdminCommandCenterScreen> createState() => _SuperAdminCommandCenterScreenState();
}

class _SuperAdminCommandCenterScreenState extends State<SuperAdminCommandCenterScreen> {
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
    final flags = (overview?['flagsActive'] as List?) ?? const [];
    final incidents = (overview?['openIncidents'] as List?) ?? const [];
    return Scaffold(
      appBar: AppBar(title: const Text('Super Admin'), actions: [
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
                      _kpi('Open sev1', '${(kpis['openIncidentsBySev'] as Map?)?['sev1'] ?? 0}'),
                      _kpi('Open sev2', '${(kpis['openIncidentsBySev'] as Map?)?['sev2'] ?? 0}'),
                      _kpi('Active flags', '${(kpis['flagsByStatus'] as Map?)?['active'] ?? 0}'),
                      _kpi('Active overrides', '${(kpis['overridesByStatus'] as Map?)?['active'] ?? 0}'),
                      _kpi('Kill switches', '${kpis['killSwitchesActive'] ?? 0}'),
                      _kpi('Audit 24h', '${kpis['auditEvents24h'] ?? 0}'),
                    ]),
                    const SizedBox(height: 12),
                    ...insights.map((i) => Card(child: ListTile(
                          leading: const Icon(Icons.shield_outlined),
                          title: Text((i as Map)['title']?.toString() ?? ''),
                          subtitle: Text(i['severity']?.toString() ?? ''),
                        ))),
                    const SizedBox(height: 12),
                    const Text('Open incidents', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...incidents.map((i) {
                      final m = i as Map<String, dynamic>;
                      return Card(child: ListTile(
                        title: Text('${m['severity']} · ${m['title']}'),
                        subtitle: Text('${m['scope']} · ${m['status']}'),
                      ));
                    }),
                    const SizedBox(height: 12),
                    const Text('Active feature flags', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...flags.map((f) {
                      final m = f as Map<String, dynamic>;
                      return Card(child: SwitchListTile(
                        title: Text(m['name']?.toString() ?? ''),
                        subtitle: Text('${m['key']} · rollout ${m['rollout_pct']}%'),
                        value: m['enabled'] == true,
                        onChanged: (v) async {
                          try {
                            await widget.api.toggleFlag(m['id']?.toString() ?? '', v);
                            _load();
                          } catch (e) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Toggle failed: $e')));
                          }
                        },
                      ));
                    }),
                  ]),
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
