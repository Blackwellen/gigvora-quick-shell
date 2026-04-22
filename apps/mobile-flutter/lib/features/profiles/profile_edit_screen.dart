// Domain 11 — Profile edit screen (basic info). Skills/portfolio are managed via dedicated sheets.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'profiles_providers.dart';

class ProfileEditScreen extends ConsumerStatefulWidget {
  final String identityId;
  const ProfileEditScreen({super.key, required this.identityId});
  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  final _form = GlobalKey<FormState>();
  final handle = TextEditingController();
  final displayName = TextEditingController();
  final headline = TextEditingController();
  final summary = TextEditingController();
  final location = TextEditingController();
  final website = TextEditingController();
  String visibility = 'public';
  bool _hydrated = false;
  bool busy = false;

  @override
  void dispose() {
    for (final c in [handle, displayName, headline, summary, location, website]) { c.dispose(); }
    super.dispose();
  }

  void _hydrate(Map<String, dynamic> p) {
    if (_hydrated) return;
    _hydrated = true;
    handle.text = '${p['handle'] ?? ''}';
    displayName.text = '${p['displayName'] ?? ''}';
    headline.text = '${p['headline'] ?? ''}';
    summary.text = '${p['summary'] ?? ''}';
    location.text = '${p['location'] ?? ''}';
    website.text = '${p['website'] ?? ''}';
    visibility = '${p['visibility'] ?? 'public'}';
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(profileDetailProvider(widget.identityId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit profile'),
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
        onRetry: () => ref.invalidate(profileDetailProvider(widget.identityId)),
        builder: (d) {
          _hydrate((d['profile'] as Map?)?.cast<String, dynamic>() ?? {});
          return Form(
            key: _form,
            child: ListView(padding: const EdgeInsets.all(16), children: [
              TextFormField(controller: handle, decoration: const InputDecoration(labelText: 'Handle'), validator: _req),
              const SizedBox(height: 12),
              TextFormField(controller: displayName, decoration: const InputDecoration(labelText: 'Display name'), validator: _req),
              const SizedBox(height: 12),
              TextFormField(controller: headline, decoration: const InputDecoration(labelText: 'Headline')),
              const SizedBox(height: 12),
              TextFormField(controller: summary, decoration: const InputDecoration(labelText: 'Summary'), maxLines: 4),
              const SizedBox(height: 12),
              TextFormField(controller: location, decoration: const InputDecoration(labelText: 'Location')),
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
                icon: const Icon(Icons.collections_outlined),
                label: const Text('Add portfolio item'),
                onPressed: () => showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => PortfolioComposeSheet(identityId: widget.identityId)),
              ),
            ]),
          );
        },
      ),
    );
  }

  String? _req(String? v) => (v == null || v.trim().isEmpty) ? 'Required' : null;

  Future<void> _save() async {
    if (!(_form.currentState?.validate() ?? false)) return;
    setState(() => busy = true);
    try {
      await ref.read(profileMutationsProvider).updateMine({
        'handle': handle.text.trim(),
        'displayName': displayName.text.trim(),
        if (headline.text.isNotEmpty) 'headline': headline.text.trim(),
        if (summary.text.isNotEmpty) 'summary': summary.text.trim(),
        if (location.text.isNotEmpty) 'location': location.text.trim(),
        if (website.text.isNotEmpty) 'website': website.text.trim(),
        'visibility': visibility,
      });
      if (mounted) { showSnack(context, 'Saved'); context.pop(); }
    } catch (e) {
      if (mounted) showSnack(context, 'Save failed: $e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

class PortfolioComposeSheet extends ConsumerStatefulWidget {
  final String identityId;
  const PortfolioComposeSheet({super.key, required this.identityId});
  @override
  ConsumerState<PortfolioComposeSheet> createState() => _PCS();
}

class _PCS extends ConsumerState<PortfolioComposeSheet> {
  final title = TextEditingController();
  final description = TextEditingController();
  final externalUrl = TextEditingController();
  bool busy = false;

  @override
  void dispose() { title.dispose(); description.dispose(); externalUrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('New portfolio item', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 12),
        TextField(controller: description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
        const SizedBox(height: 12),
        TextField(controller: externalUrl, decoration: const InputDecoration(labelText: 'External URL (optional)')),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: busy || title.text.trim().isEmpty ? null : () async {
            setState(() => busy = true);
            try {
              await ref.read(profileMutationsProvider).addPortfolio(widget.identityId, {
                'title': title.text.trim(),
                if (description.text.isNotEmpty) 'description': description.text.trim(),
                if (externalUrl.text.isNotEmpty) 'externalUrl': externalUrl.text.trim(),
              });
              if (context.mounted) { Navigator.pop(context); showSnack(context, 'Added'); }
            } catch (e) {
              if (context.mounted) showSnack(context, 'Failed: $e');
            } finally { if (mounted) setState(() => busy = false); }
          },
          child: const Text('Add'),
        ),
      ]),
    );
  }
}
