// Domain 13 — Agency screens: list (discover), detail, inquiry compose.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'agency_api.dart';

class AgencyListScreen extends ConsumerStatefulWidget {
  const AgencyListScreen({super.key});
  @override
  ConsumerState<AgencyListScreen> createState() => _AgencyListScreenState();
}

class _AgencyListScreenState extends ConsumerState<AgencyListScreen> {
  String _q = '';
  final _ctrl = TextEditingController();

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final asyncList = ref.watch(agencyListProvider(_q));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agencies'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: TextField(
              controller: _ctrl,
              textInputAction: TextInputAction.search,
              onSubmitted: (v) => setState(() => _q = v.trim()),
              decoration: InputDecoration(
                hintText: 'Search agencies, services, industry',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(agencyListProvider(_q).future),
        child: asyncList.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorState(message: '$e', onRetry: () => ref.refresh(agencyListProvider(_q).future)),
          data: (page) {
            final items = (page['items'] as List? ?? const [])
                .map((e) => Map<String, dynamic>.from(e as Map)).toList();
            if (items.isEmpty) {
              return ListView(children: const [SizedBox(height: 120), Center(child: Text('No agencies found'))]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final a = items[i];
                final id = (a['slug'] ?? a['id'] ?? '').toString();
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text((a['name'] ?? '?').toString().characters.first)),
                    title: Text((a['name'] ?? 'Agency').toString()),
                    subtitle: Text((a['tagline'] ?? a['industry'] ?? '').toString()),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/agencies/$id'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class AgencyDetailScreen extends ConsumerWidget {
  final String idOrSlug;
  const AgencyDetailScreen({super.key, required this.idOrSlug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncDetail = ref.watch(agencyDetailProvider(idOrSlug));
    return Scaffold(
      appBar: AppBar(title: const Text('Agency')),
      body: asyncDetail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorState(message: '$e', onRetry: () => ref.refresh(agencyDetailProvider(idOrSlug).future)),
        data: (a) => DefaultTabController(
          length: 4,
          child: NestedScrollView(
            headerSliverBuilder: (_, __) => [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text((a['name'] ?? '').toString(), style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 4),
                    Text((a['tagline'] ?? '').toString(), style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 12),
                    Wrap(spacing: 8, children: [
                      Chip(label: Text('${a['employeeCount'] ?? 0} people')),
                      Chip(label: Text('${a['followerCount'] ?? 0} followers')),
                      if (a['verified'] == true) const Chip(label: Text('Verified'), avatar: Icon(Icons.verified, size: 16)),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      FilledButton.icon(
                        onPressed: () async {
                          final api = ref.read(agencyApiProvider);
                          final id = (a['id'] ?? a['slug']).toString();
                          await api.follow(id, follow: true);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Following')));
                          }
                        },
                        icon: const Icon(Icons.add), label: const Text('Follow'),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: () => _openInquirySheet(context, ref, (a['id'] ?? a['slug']).toString()),
                        icon: const Icon(Icons.mail_outline), label: const Text('Contact'),
                      ),
                    ]),
                  ]),
                ),
              ),
              const SliverToBoxAdapter(
                child: TabBar(tabs: [
                  Tab(text: 'About'), Tab(text: 'Services'), Tab(text: 'Case studies'), Tab(text: 'Team'),
                ]),
              ),
            ],
            body: TabBarView(children: [
              SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Text((a['about'] ?? '').toString()),
              ),
              _ServicesTab(agencyId: (a['id'] ?? a['slug']).toString()),
              _CaseStudiesTab(agencyId: (a['id'] ?? a['slug']).toString()),
              _TeamTab(agencyId: (a['id'] ?? a['slug']).toString()),
            ]),
          ),
        ),
      ),
    );
  }

  void _openInquirySheet(BuildContext context, WidgetRef ref, String agencyId) {
    final subjectCtrl = TextEditingController();
    final bodyCtrl    = TextEditingController();
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Send inquiry', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          TextField(controller: subjectCtrl, decoration: const InputDecoration(labelText: 'Subject')),
          const SizedBox(height: 8),
          TextField(controller: bodyCtrl, maxLines: 4, decoration: const InputDecoration(labelText: 'Message')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () async {
              try {
                await ref.read(agencyApiProvider).sendInquiry(agencyId, {
                  'subject': subjectCtrl.text.trim(),
                  'body': bodyCtrl.text.trim(),
                });
                if (context.mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inquiry sent')));
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              }
            },
            child: const Text('Send'),
          ),
        ]),
      ),
    );
  }
}

class _ServicesTab extends ConsumerWidget {
  final String agencyId;
  const _ServicesTab({required this.agencyId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fut = ref.watch(_servicesProvider(agencyId));
    return fut.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e')),
      data: (items) => items.isEmpty
          ? const Center(child: Text('No services listed'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => Card(
                child: ListTile(
                  title: Text((items[i]['title'] ?? '').toString()),
                  subtitle: Text((items[i]['summary'] ?? '').toString()),
                  trailing: Text((items[i]['priceBand'] ?? '').toString()),
                ),
              ),
            ),
    );
  }
}

class _CaseStudiesTab extends ConsumerWidget {
  final String agencyId;
  const _CaseStudiesTab({required this.agencyId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fut = ref.watch(_caseStudiesProvider(agencyId));
    return fut.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e')),
      data: (items) => items.isEmpty
          ? const Center(child: Text('No case studies'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => Card(
                child: ListTile(
                  title: Text((items[i]['title'] ?? '').toString()),
                  subtitle: Text((items[i]['summary'] ?? '').toString()),
                  isThreeLine: true,
                ),
              ),
            ),
    );
  }
}

class _TeamTab extends ConsumerWidget {
  final String agencyId;
  const _TeamTab({required this.agencyId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fut = ref.watch(_teamProvider(agencyId));
    return fut.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e')),
      data: (items) => items.isEmpty
          ? const Center(child: Text('No team members'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) => ListTile(
                leading: CircleAvatar(child: Text((items[i]['name'] ?? '?').toString().characters.first)),
                title: Text((items[i]['name'] ?? '').toString()),
                subtitle: Text((items[i]['title'] ?? items[i]['role'] ?? '').toString()),
              ),
            ),
    );
  }
}

final _servicesProvider = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, id) =>
  ref.watch(agencyApiProvider).services(id));
final _caseStudiesProvider = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, id) =>
  ref.watch(agencyApiProvider).caseStudies(id));
final _teamProvider = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, id) =>
  ref.watch(agencyApiProvider).team(id));

class _ErrorState extends StatelessWidget {
  final String message; final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return ListView(children: [
      const SizedBox(height: 80),
      Center(child: Column(children: [
        const Icon(Icons.error_outline, size: 48),
        const SizedBox(height: 8),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 16),
        FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('Retry')),
      ])),
    ]);
  }
}
