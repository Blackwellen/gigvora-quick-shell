// Domain 12 — Company edit (admin/editor).
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'companies_providers.dart';

class CompanyEditScreen extends ConsumerStatefulWidget {
  final String companyId;
  const CompanyEditScreen({super.key, required this.companyId});
  @override
  ConsumerState<CompanyEditScreen> createState() => _CES();
}

class _CES extends ConsumerState<CompanyEditScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController();
  final tagline = TextEditingController();
  final about = TextEditingController();
  final website = TextEditingController();
  final industry = TextEditingController();
  String visibility = 'public';
  bool _hydrated = false;
  bool busy = false;

  @override
  void dispose() { for (final c in [name, tagline, about, website, industry]) { c.dispose(); } super.dispose(); }

  void _hydrate(Map<String, dynamic> c) {
    if (_hydrated) return; _hydrated = true;
    name.text = '${c['name'] ?? ''}';
    tagline.text = '${c['tagline'] ?? ''}';
    about.text = '${c['about'] ?? ''}';
    website.text = '${c['website'] ?? ''}';
    industry.text = '${c['industry'] ?? ''}';
    visibility = '${c['visibility'] ?? 'public'}';
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(companyDetailProvider(widget.companyId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit company'),
        actions: [
          TextButton(
            onPressed: busy ? null : _save,
            child: busy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
          ),
        ],
      ),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: detail.isLoading,
        error: detail.hasError ? detail.error : null,
        data: detail.value,
        onRetry: () => ref.invalidate(companyDetailProvider(widget.companyId)),
        builder: (d) {
          _hydrate(((d['company'] as Map?) ?? {}).cast<String, dynamic>());
          return Form(
            key: form,
            child: ListView(padding: const EdgeInsets.all(16), children: [
              TextFormField(controller: name, decoration: const InputDecoration(labelText: 'Name'), validator: _req),
              const SizedBox(height: 12),
              TextFormField(controller: tagline, decoration: const InputDecoration(labelText: 'Tagline')),
              const SizedBox(height: 12),
              TextFormField(controller: about, decoration: const InputDecoration(labelText: 'About'), maxLines: 5),
              const SizedBox(height: 12),
              TextFormField(controller: industry, decoration: const InputDecoration(labelText: 'Industry')),
              const SizedBox(height: 12),
              TextFormField(controller: website, decoration: const InputDecoration(labelText: 'Website')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: visibility,
                decoration: const InputDecoration(labelText: 'Visibility'),
                items: const ['public','network','private'].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                onChanged: (v) => setState(() => visibility = v ?? 'public'),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                icon: const Icon(Icons.person_add_outlined),
                label: const Text('Invite member'),
                onPressed: () => showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => InviteMemberSheet(companyId: widget.companyId)),
              ),
            ]),
          );
        },
      ),
    );
  }

  String? _req(String? v) => (v == null || v.trim().isEmpty) ? 'Required' : null;

  Future<void> _save() async {
    if (!(form.currentState?.validate() ?? false)) return;
    setState(() => busy = true);
    try {
      await ref.read(companyMutationsProvider).update(widget.companyId, {
        'name': name.text.trim(),
        if (tagline.text.isNotEmpty) 'tagline': tagline.text.trim(),
        if (about.text.isNotEmpty) 'about': about.text.trim(),
        if (industry.text.isNotEmpty) 'industry': industry.text.trim(),
        if (website.text.isNotEmpty) 'website': website.text.trim(),
        'visibility': visibility,
      });
      if (mounted) { showSnack(context, 'Saved'); context.pop(); }
    } catch (e) {
      if (mounted) showSnack(context, 'Save failed: $e');
    } finally { if (mounted) setState(() => busy = false); }
  }
}

class InviteMemberSheet extends ConsumerStatefulWidget {
  final String companyId;
  const InviteMemberSheet({super.key, required this.companyId});
  @override
  ConsumerState<InviteMemberSheet> createState() => _IMS();
}

class _IMS extends ConsumerState<InviteMemberSheet> {
  final identityId = TextEditingController();
  final title = TextEditingController();
  String role = 'editor';
  bool busy = false;

  @override
  void dispose() { identityId.dispose(); title.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('Invite member', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        TextField(controller: identityId, decoration: const InputDecoration(labelText: 'Identity ID')),
        const SizedBox(height: 12),
        TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: role,
          decoration: const InputDecoration(labelText: 'Role'),
          items: const ['admin','editor','viewer'].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
          onChanged: (v) => setState(() => role = v ?? 'editor'),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: busy || identityId.text.trim().isEmpty ? null : () async {
            setState(() => busy = true);
            try {
              await ref.read(companyMutationsProvider).invite(widget.companyId, {
                'identityId': identityId.text.trim(),
                'role': role,
                if (title.text.isNotEmpty) 'title': title.text.trim(),
              });
              if (context.mounted) { Navigator.pop(context); showSnack(context, 'Invited'); }
            } catch (e) {
              if (context.mounted) showSnack(context, 'Failed: $e');
            } finally { if (mounted) setState(() => busy = false); }
          },
          child: const Text('Send invite'),
        ),
      ]),
    );
  }
}
