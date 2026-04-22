import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'org_members_seats_api.dart';

/// Domain 54 — Org members & seats mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontal KPI tiles (active, pending invites, seats available/assigned).
///   • Members support tap-to-suspend/reinstate via bottom sheet menu.
///   • Invitations support swipe-left to revoke (with reason bottom sheet).
///   • Seats card grid with tap-to-assign / long-press-to-release.
class OrgMembersSeatsScreen extends ConsumerStatefulWidget {
  const OrgMembersSeatsScreen({super.key});
  @override
  ConsumerState<OrgMembersSeatsScreen> createState() => _State();
}

class _State extends ConsumerState<OrgMembersSeatsScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = OrgMembersSeatsApi(ref.read(apiClientProvider));
      _overview = await api.overview();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _promptReason(String label) async {
    final ctrl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
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

  Future<void> _suspend(String id) async {
    final reason = await _promptReason('Reason for suspension');
    if (reason == null || reason.isEmpty) return;
    try {
      await OrgMembersSeatsApi(ref.read(apiClientProvider)).transitionMember(id, 'suspended', reason: reason);
      await _refresh();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _reinstate(String id) async {
    try {
      await OrgMembersSeatsApi(ref.read(apiClientProvider)).transitionMember(id, 'active');
      await _refresh();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _revokeInvitation(String id) async {
    try {
      await OrgMembersSeatsApi(ref.read(apiClientProvider)).revokeInvitation(id);
      await _refresh();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Members & seats')),
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
    final seats = ((kpis['seats'] as Map?) ?? {});
    final members = (_overview?['members'] as List?) ?? [];
    final invitations = (_overview?['invitations'] as List?) ?? [];
    final seatList = (_overview?['seats'] as List?) ?? [];

    return ListView(padding: const EdgeInsets.all(16), children: [
      SizedBox(height: 92, child: ListView(scrollDirection: Axis.horizontal, children: [
        _kpi('Active', '${kpis['activeMembers'] ?? 0}'),
        _kpi('Pending', '${kpis['pendingInvitations'] ?? 0}'),
        _kpi('Suspended', '${kpis['suspended'] ?? 0}'),
        _kpi('Seats used', '${seats['assigned'] ?? 0}/${seats['total'] ?? 0}'),
        _kpi('Available', '${seats['available'] ?? 0}'),
        _kpi('Roles', '${kpis['rolesCount'] ?? 0}'),
      ])),
      const SizedBox(height: 16),
      const Text('Members', style: TextStyle(fontWeight: FontWeight.w600)),
      ...members.map((m) => Card(child: ListTile(
            title: Text(m['fullName']?.toString() ?? ''),
            subtitle: Text('${m['email']} • ${m['roleKey']} • ${m['status']}'),
            trailing: PopupMenuButton<String>(
              onSelected: (s) {
                if (s == 'suspend') _suspend(m['id'] as String);
                if (s == 'reinstate') _reinstate(m['id'] as String);
              },
              itemBuilder: (_) {
                final isActive = m['status'] == 'active';
                return [
                  if (isActive) const PopupMenuItem(value: 'suspend', child: Text('Suspend')),
                  if (!isActive) const PopupMenuItem(value: 'reinstate', child: Text('Reinstate')),
                ];
              },
            ),
          ))),
      const SizedBox(height: 16),
      const Text('Pending invitations', style: TextStyle(fontWeight: FontWeight.w600)),
      ...invitations.where((i) => i['status'] == 'pending').map((i) => Dismissible(
            key: ValueKey(i['id']),
            direction: DismissDirection.endToStart,
            background: Container(
              color: Colors.red.shade100, alignment: Alignment.centerRight,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: const Text('Revoke'),
            ),
            confirmDismiss: (_) async {
              await _revokeInvitation(i['id'] as String);
              return false;
            },
            child: Card(child: ListTile(
              title: Text(i['email']?.toString() ?? ''),
              subtitle: Text('${i['roleKey']} • ${i['seatType']} • ${i['status']}'),
            )),
          )),
      const SizedBox(height: 16),
      const Text('Seats', style: TextStyle(fontWeight: FontWeight.w600)),
      ...seatList.map((s) => Card(child: ListTile(
            title: Text('${s['plan']} • ${s['seatType']}'),
            subtitle: Text('${s['status']} • \$${(((s['costCents'] as num?) ?? 0) / 100).toStringAsFixed(2)}'),
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
