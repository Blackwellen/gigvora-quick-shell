// Domain 11 — Profile detail view (11-tab system collapsed to a tab bar on mobile).
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'profiles_providers.dart';

class ProfileViewScreen extends ConsumerWidget {
  final String identityId;
  const ProfileViewScreen({super.key, required this.identityId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(profileDetailProvider(identityId));
    return DefaultTabController(
      length: 8,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Profile'),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => context.go('/profile/$identityId/edit'),
              tooltip: 'Edit',
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Experience'),
              Tab(text: 'Education'),
              Tab(text: 'Skills'),
              Tab(text: 'Portfolio'),
              Tab(text: 'Reviews'),
              Tab(text: 'Badges'),
              Tab(text: 'Verifications'),
            ],
          ),
        ),
        body: AsyncStateView<Map<String, dynamic>>(
          isLoading: detail.isLoading,
          error: detail.hasError ? detail.error : null,
          data: detail.value,
          onRetry: () => ref.invalidate(profileDetailProvider(identityId)),
          builder: (d) {
            final tabs = (d['tabs'] as Map?) ?? {};
            final profile = (d['profile'] as Map?) ?? {};
            final reputation = (d['reputation'] as Map?) ?? {};
            return TabBarView(children: [
              _OverviewTab(profile: profile, reputation: reputation),
              _ListTab(items: (tabs['experience'] as List?) ?? const [], titleKey: 'title', subKey: 'company'),
              _ListTab(items: (tabs['education'] as List?) ?? const [], titleKey: 'institution', subKey: 'degree'),
              _SkillsTab(identityId: identityId, items: (tabs['skills'] as List?) ?? const []),
              _ListTab(items: (tabs['media'] as List?) ?? const [], titleKey: 'title', subKey: 'description'),
              _ReviewsTab(items: (tabs['reviews'] as List?) ?? const []),
              _BadgesTab(identityId: identityId),
              _VerificationsTab(identityId: identityId),
            ]);
          },
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final Map profile;
  final Map reputation;
  const _OverviewTab({required this.profile, required this.reputation});
  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      ListTile(
        leading: CircleAvatar(
          radius: 32,
          backgroundImage: profile['avatarUrl'] != null ? NetworkImage(profile['avatarUrl']) : null,
          child: profile['avatarUrl'] == null ? const Icon(Icons.person) : null,
        ),
        title: Text('${profile['displayName'] ?? '—'}', style: Theme.of(context).textTheme.titleLarge),
        subtitle: Text('${profile['headline'] ?? ''}'),
      ),
      const SizedBox(height: 12),
      if (profile['summary'] != null) Text('${profile['summary']}'),
      const SizedBox(height: 16),
      Card(
        child: ListTile(
          title: const Text('Reputation'),
          subtitle: Text('Score ${reputation['score'] ?? '—'} · band ${reputation['band'] ?? 'new'}'),
          leading: const Icon(Icons.shield_outlined),
        ),
      ),
    ]);
  }
}

class _ListTab extends StatelessWidget {
  final List items; final String titleKey; final String subKey;
  const _ListTab({required this.items, required this.titleKey, required this.subKey});
  @override
  Widget build(BuildContext context) {
    return AsyncStateView<List>(
      data: items,
      isEmpty: items.isEmpty,
      builder: (rows) => ListView.separated(
        padding: const EdgeInsets.all(8),
        itemBuilder: (_, i) {
          final m = rows[i] as Map;
          return ListTile(title: Text('${m[titleKey] ?? ''}'), subtitle: Text('${m[subKey] ?? ''}'));
        },
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemCount: rows.length,
      ),
    );
  }
}

class _SkillsTab extends ConsumerWidget {
  final String identityId; final List items;
  const _SkillsTab({required this.identityId, required this.items});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncStateView<List>(
      data: items, isEmpty: items.isEmpty,
      builder: (rows) => Padding(
        padding: const EdgeInsets.all(12),
        child: Wrap(spacing: 8, runSpacing: 8, children: [
          for (final s in rows)
            InputChip(
              label: Text('${(s as Map)['skill']}  · ${s['endorsementCount'] ?? 0}'),
              onPressed: () async {
                await ref.read(profilesApiProvider).endorse(identityId, '${s['id']}');
                ref.invalidate(profileDetailProvider(identityId));
                if (context.mounted) showSnack(context, 'Endorsed');
              },
            ),
        ]),
      ),
    );
  }
}

class _ReviewsTab extends StatelessWidget {
  final List items;
  const _ReviewsTab({required this.items});
  @override
  Widget build(BuildContext context) {
    return AsyncStateView<List>(
      data: items, isEmpty: items.isEmpty,
      builder: (rows) => ListView.separated(
        itemBuilder: (_, i) {
          final r = rows[i] as Map;
          return ListTile(
            leading: const Icon(Icons.star, color: Colors.amber),
            title: Text('${r['rating']}/5'),
            subtitle: Text('${r['body'] ?? ''}'),
          );
        },
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemCount: rows.length,
      ),
    );
  }
}

class _BadgesTab extends ConsumerWidget {
  final String identityId;
  const _BadgesTab({required this.identityId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final b = ref.watch(badgesProvider(identityId));
    return AsyncStateView<List>(
      isLoading: b.isLoading, error: b.hasError ? b.error : null, data: b.value,
      isEmpty: (b.value ?? const []).isEmpty,
      onRetry: () => ref.invalidate(badgesProvider(identityId)),
      builder: (rows) => Padding(
        padding: const EdgeInsets.all(12),
        child: Wrap(spacing: 8, runSpacing: 8, children: [
          for (final m in rows.cast<Map>()) Chip(avatar: const Icon(Icons.verified), label: Text('${m['label']}')),
        ]),
      ),
    );
  }
}

class _VerificationsTab extends ConsumerWidget {
  final String identityId;
  const _VerificationsTab({required this.identityId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final v = ref.watch(myVerificationsProvider);
    return AsyncStateView<List>(
      isLoading: v.isLoading, error: v.hasError ? v.error : null, data: v.value,
      isEmpty: (v.value ?? const []).isEmpty,
      onRetry: () => ref.invalidate(myVerificationsProvider),
      builder: (rows) => Column(children: [
        Expanded(
          child: ListView.separated(
            itemBuilder: (_, i) {
              final m = rows[i] as Map;
              return ListTile(
                leading: const Icon(Icons.verified_user_outlined),
                title: Text('${m['kind']}'),
                subtitle: Text('${m['status']}'),
              );
            },
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemCount: rows.length,
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: FilledButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Request verification'),
            onPressed: () => showModalBottomSheet(
              context: context,
              builder: (_) => const VerificationRequestSheet(),
            ),
          ),
        ),
      ]),
    );
  }
}

class VerificationRequestSheet extends ConsumerStatefulWidget {
  const VerificationRequestSheet({super.key});
  @override
  ConsumerState<VerificationRequestSheet> createState() => _VRState();
}

class _VRState extends ConsumerState<VerificationRequestSheet> {
  String kind = 'email';
  final url = TextEditingController();
  bool busy = false;

  @override
  void dispose() { url.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('Request verification', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: kind,
          items: const ['email','phone','id_document','company','linkedin','github']
              .map((k) => DropdownMenuItem(value: k, child: Text(k))).toList(),
          onChanged: (v) => setState(() => kind = v ?? 'email'),
        ),
        const SizedBox(height: 12),
        TextField(controller: url, decoration: const InputDecoration(labelText: 'Evidence URL (optional)')),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: busy ? null : () async {
            setState(() => busy = true);
            try {
              await ref.read(profileMutationsProvider).requestVerification(kind, evidenceUrl: url.text.isEmpty ? null : url.text);
              if (context.mounted) { Navigator.pop(context); showSnack(context, 'Request submitted'); }
            } catch (e) {
              if (context.mounted) showSnack(context, 'Failed: $e');
            } finally { if (mounted) setState(() => busy = false); }
          },
          child: const Text('Submit'),
        ),
      ]),
    );
  }
}
