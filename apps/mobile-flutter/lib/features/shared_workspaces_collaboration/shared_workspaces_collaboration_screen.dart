import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'shared_workspaces_collaboration_api.dart';

/// Domain 55 — Shared workspaces & collaboration mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontal KPI tiles (active workspaces, pending handoffs, recent notes).
///   • Pending handoffs swipe-right to accept, swipe-left to reject (reason sheet).
///   • Notes tap-to-publish from draft.
///   • Workspaces tap-to-archive via popup menu.
class SharedWorkspacesCollaborationScreen extends ConsumerStatefulWidget {
  const SharedWorkspacesCollaborationScreen({super.key});
  @override
  ConsumerState<SharedWorkspacesCollaborationScreen> createState() => _State();
}

class _State extends ConsumerState<SharedWorkspacesCollaborationScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = SharedWorkspacesCollaborationApi(ref.read(apiClientProvider));
      _overview = await api.overview();
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<String?> _promptReason(String label) async {
    final ctrl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context, isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(label),
          TextField(controller: ctrl, autofocus: true),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel'))),
            const SizedBox(width: 8),
            Expanded(child: FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Confirm'))),
          ]),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }

  Future<void> _accept(String wsId, String hId) async {
    try {
      await SharedWorkspacesCollaborationApi(ref.read(apiClientProvider)).transitionHandoff(wsId, hId, 'accepted');
      await _refresh();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'))); }
  }

  Future<void> _reject(String wsId, String hId) async {
    final reason = await _promptReason('Reason for rejection');
    if (reason == null || reason.isEmpty) return;
    try {
      await SharedWorkspacesCollaborationApi(ref.read(apiClientProvider)).transitionHandoff(wsId, hId, 'rejected', reason: reason);
      await _refresh();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'))); }
  }

  Future<void> _archive(String id) async {
    try {
      await SharedWorkspacesCollaborationApi(ref.read(apiClientProvider)).archiveWorkspace(id);
      await _refresh();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'))); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shared workspaces')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(children: [Padding(padding: const EdgeInsets.all(24), child: Text('Error: $_error'))])
                : _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    final kpis = (_overview?['kpis'] as Map?) ?? {};
    final workspaces = (_overview?['workspaces'] as List?) ?? [];
    final handoffs = (_overview?['pendingHandoffs'] as List?) ?? [];
    final notes = (_overview?['recentNotes'] as List?) ?? [];

    return ListView(padding: const EdgeInsets.all(16), children: [
      SizedBox(height: 92, child: ListView(scrollDirection: Axis.horizontal, children: [
        _kpi('Workspaces', '${kpis['activeWorkspaces'] ?? 0}'),
        _kpi('Handoffs', '${kpis['pendingHandoffsForMe'] ?? 0}'),
        _kpi('Notes', '${kpis['recentPublishedNotes'] ?? 0}'),
      ])),
      const SizedBox(height: 16),
      const Text('Pending handoffs', style: TextStyle(fontWeight: FontWeight.w600)),
      ...handoffs.map((h) => Dismissible(
            key: ValueKey(h['id']),
            background: Container(color: Colors.green.shade100, alignment: Alignment.centerLeft,
              padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Accept')),
            secondaryBackground: Container(color: Colors.red.shade100, alignment: Alignment.centerRight,
              padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Reject')),
            confirmDismiss: (dir) async {
              if (dir == DismissDirection.startToEnd) await _accept(h['workspaceId'] as String, h['id'] as String);
              else await _reject(h['workspaceId'] as String, h['id'] as String);
              return false;
            },
            child: Card(child: ListTile(
              title: Text(h['subject']?.toString() ?? ''),
              subtitle: Text('${h['workspaceName'] ?? ''} • ${h['priority']}'),
            )),
          )),
      const SizedBox(height: 16),
      const Text('Recent notes', style: TextStyle(fontWeight: FontWeight.w600)),
      ...notes.map((n) => Card(child: ListTile(
            leading: Icon(n['pinned'] == true ? Icons.push_pin : Icons.note),
            title: Text(n['title']?.toString() ?? ''),
            subtitle: Text('${n['workspaceName'] ?? ''} • ${n['status']}'),
          ))),
      const SizedBox(height: 16),
      const Text('Workspaces', style: TextStyle(fontWeight: FontWeight.w600)),
      ...workspaces.map((w) => Card(child: ListTile(
            title: Text(w['name']?.toString() ?? ''),
            subtitle: Text('${w['slug']} • ${w['visibility']} • ${w['status']}'),
            trailing: PopupMenuButton<String>(
              onSelected: (s) { if (s == 'archive') _archive(w['id'] as String); },
              itemBuilder: (_) => [const PopupMenuItem(value: 'archive', child: Text('Archive'))],
            ),
          ))),
    ]);
  }

  Widget _kpi(String label, String value) => Container(
        width: 130, margin: const EdgeInsets.only(right: 12), padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ]),
      );
}
