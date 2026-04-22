// Domain 66 — Internal Admin Shell mobile screen (touch-friendly stacked cards
// with bottom-sheet queue jump action).
import 'package:flutter/material.dart';
import 'internal_admin_shell_api.dart';

class IasShellScreen extends StatefulWidget {
  const IasShellScreen({super.key, required this.api});
  final IasApi api;

  @override
  State<IasShellScreen> createState() => _IasShellScreenState();
}

class _IasShellScreenState extends State<IasShellScreen> {
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

  Future<void> _jump() async {
    try {
      final r = await widget.api.queueJump();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(r['item'] == null ? 'No pending items' : 'Claimed: ${r['item']['reference']}'),
      ));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Queue jump failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (overview?['kpis'] as Map<String, dynamic>?) ?? const {};
    final queues = (overview?['queues'] as List?) ?? const [];
    final insights = (overview?['insights'] as List?) ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Shell'), actions: [
        IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
      ]),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
              ? Center(child: Text('Error: $error'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      Wrap(spacing: 8, runSpacing: 8, children: [
                        _kpi('Workspaces', '${kpis['visibleWorkspaces'] ?? 0}/${kpis['workspaces'] ?? 0}'),
                        _kpi('Queues', '${kpis['queues'] ?? 0}'),
                        _kpi('Depth', '${kpis['totalDepth'] ?? 0}'),
                      ]),
                      const SizedBox(height: 12),
                      ...insights.map((i) => Card(child: ListTile(
                        leading: const Icon(Icons.info_outline),
                        title: Text((i as Map)['title']?.toString() ?? ''),
                        subtitle: Text(i['severity']?.toString() ?? ''),
                      ))),
                      const SizedBox(height: 12),
                      const Text('Queues', style: TextStyle(fontWeight: FontWeight.bold)),
                      ...queues.map((q) {
                        final m = q as Map<String, dynamic>;
                        return Card(child: ListTile(
                          title: Text(m['label']?.toString() ?? ''),
                          subtitle: Text('${m['domain']} · depth ${m['depth']} · ${m['health']}'),
                          trailing: Text('SLA ${m['sla_minutes']}m'),
                        ));
                      }),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _jump,
        icon: const Icon(Icons.flash_on),
        label: const Text('Queue Jump'),
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
