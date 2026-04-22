// Domain 12 — Company directory list.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'companies_providers.dart';

class CompaniesListScreen extends ConsumerStatefulWidget {
  const CompaniesListScreen({super.key});
  @override
  ConsumerState<CompaniesListScreen> createState() => _S();
}

class _S extends ConsumerState<CompaniesListScreen> {
  String q = '';
  String? industry;

  @override
  Widget build(BuildContext context) {
    final query = CompanyListQuery(q: q.isEmpty ? null : q, industry: industry);
    final list = ref.watch(companyListProvider(query));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Companies'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: TextField(
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search companies', isDense: true, border: OutlineInputBorder()),
              onSubmitted: (v) => setState(() => q = v.trim()),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async { ref.invalidate(companyListProvider(query)); },
        child: AsyncStateView<CompaniesPage>(
          isLoading: list.isLoading,
          error: list.hasError ? list.error : null,
          data: list.value,
          isEmpty: (list.value?.items.isEmpty ?? true),
          onRetry: () => ref.invalidate(companyListProvider(query)),
          emptyTitle: 'No companies found',
          emptyMessage: 'Try a different search.',
          builder: (page) => ListView.separated(
            itemCount: page.items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final c = page.items[i];
              return ListTile(
                leading: CircleAvatar(child: Text('${(c['name'] ?? '?')[0]}'.toUpperCase())),
                title: Text('${c['name'] ?? '—'}'),
                subtitle: Text('${c['industry'] ?? ''}  ·  ${c['size'] ?? ''}'),
                onTap: () => context.go('/company/${c['slug'] ?? c['id']}'),
              );
            },
          ),
        ),
      ),
    );
  }
}
