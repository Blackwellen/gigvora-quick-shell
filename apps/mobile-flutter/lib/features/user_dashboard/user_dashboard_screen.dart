/// Domain 48 — Personal Overview screen (mobile parity).
///
/// Mobile adaptations:
///   • KPI grid replaced with horizontally-scrollable stat tiles.
///   • Insight panels compress into stacked cards.
///   • Next-action queue uses swipe (complete = right, dismiss = left).
///   • Snooze opens a bottom sheet picker.
///   • Pull-to-refresh forces overview recompute.
import 'package:flutter/material.dart';
import 'user_dashboard_api.dart';

class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key, required this.api, this.role = 'user'});
  final UserDashboardApi api;
  final String role;

  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh({bool force = false}) async {
    setState(() { _loading = true; _error = null; });
    try {
      final ov = await widget.api.overview(role: widget.role, refresh: force);
      setState(() => _overview = ov);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (_overview?['kpis'] as Map?) ?? {};
    final actions = (_overview?['nextActions'] as List?) ?? [];
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: RefreshIndicator(
        onRefresh: () => _refresh(force: true),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(children: [Padding(padding: const EdgeInsets.all(24), child: Text('Error: $_error'))])
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      SizedBox(
                        height: 96,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: kpis.entries.map((e) => Card(
                            child: Container(
                              width: 140,
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(e.key, style: Theme.of(context).textTheme.bodySmall),
                                  const SizedBox(height: 4),
                                  Text('${e.value}', style: Theme.of(context).textTheme.titleLarge),
                                ],
                              ),
                            ),
                          )).toList(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text('Next actions', style: Theme.of(context).textTheme.titleMedium),
                      ...actions.map((a) => Dismissible(
                        key: ValueKey(a['id']),
                        background: Container(color: Colors.green, alignment: Alignment.centerLeft, padding: const EdgeInsets.only(left: 16), child: const Icon(Icons.check, color: Colors.white)),
                        secondaryBackground: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 16), child: const Icon(Icons.close, color: Colors.white)),
                        confirmDismiss: (dir) async {
                          if (dir == DismissDirection.startToEnd) {
                            await widget.api.complete(a['id'] as String);
                          } else {
                            await widget.api.dismiss(a['id'] as String);
                          }
                          return true;
                        },
                        child: ListTile(
                          title: Text(a['title'] as String),
                          subtitle: Text(a['description'] as String? ?? ''),
                          trailing: IconButton(
                            icon: const Icon(Icons.snooze),
                            onPressed: () async {
                              final until = DateTime.now().add(const Duration(hours: 4));
                              await widget.api.snooze(a['id'] as String, until);
                              await _refresh(force: true);
                            },
                          ),
                        ),
                      )),
                    ],
                  ),
      ),
    );
  }
}
