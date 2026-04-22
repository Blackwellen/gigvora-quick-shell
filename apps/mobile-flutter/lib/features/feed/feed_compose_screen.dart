import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'feed_providers.dart';

/// Domain 09 — Feed compose screen.
/// Kind segmented control (text / opportunity), body, visibility,
/// validation, and idempotency-keyed publish.
class FeedComposeScreen extends ConsumerStatefulWidget {
  const FeedComposeScreen({super.key});
  @override
  ConsumerState<FeedComposeScreen> createState() => _FeedComposeScreenState();
}

class _FeedComposeScreenState extends ConsumerState<FeedComposeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _body = TextEditingController();
  final _oppTitle = TextEditingController();
  final _oppLocation = TextEditingController();
  String _kind = 'text';
  String _visibility = 'public';
  late final String _idempotencyKey;

  @override
  void initState() {
    super.initState();
    _idempotencyKey = _genKey();
  }

  String _genKey() {
    final r = Random.secure();
    final bytes = List<int>.generate(16, (_) => r.nextInt(256));
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  @override
  void dispose() {
    _body.dispose();
    _oppTitle.dispose();
    _oppLocation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final composing = ref.watch(feedComposeControllerProvider);
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/feed'),
        ),
        title: const Text('New post'),
        actions: [
          TextButton(
            onPressed: composing.isLoading ? null : _submit,
            child: composing.isLoading
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Publish'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'text', label: Text('Text'), icon: Icon(Icons.short_text)),
                ButtonSegment(value: 'opportunity', label: Text('Opportunity'), icon: Icon(Icons.work_outline)),
              ],
              selected: {_kind},
              onSelectionChanged: (s) => setState(() => _kind = s.first),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _body,
              maxLines: 8,
              maxLength: 8000,
              decoration: const InputDecoration(
                labelText: 'What do you want to share?',
                border: OutlineInputBorder(),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Body is required' : null,
            ),
            if (_kind == 'opportunity') ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: _oppTitle,
                decoration: const InputDecoration(
                  labelText: 'Opportunity title',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => _kind == 'opportunity' && (v == null || v.trim().isEmpty)
                    ? 'Opportunity needs a title'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _oppLocation,
                decoration: const InputDecoration(
                  labelText: 'Location (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _visibility,
              decoration: const InputDecoration(
                labelText: 'Visibility',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'public', child: Text('Public')),
                DropdownMenuItem(value: 'followers', child: Text('Followers')),
                DropdownMenuItem(value: 'connections', child: Text('Connections')),
                DropdownMenuItem(value: 'private', child: Text('Only me')),
              ],
              onChanged: (v) => setState(() => _visibility = v ?? 'public'),
            ),
            if (composing.hasError) ...[
              const SizedBox(height: 16),
              Text('Could not publish: ${composing.error}',
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      final post = await ref.read(feedComposeControllerProvider.notifier).publish(
        kind: _kind,
        body: _body.text.trim(),
        visibility: _visibility,
        opportunity: _kind == 'opportunity'
            ? {
                'title': _oppTitle.text.trim(),
                if (_oppLocation.text.trim().isNotEmpty) 'location': _oppLocation.text.trim(),
              }
            : null,
        idempotencyKey: _idempotencyKey,
      );
      if (mounted) {
        showSnack(context, 'Posted');
        context.go('/feed/${post.id}');
      }
    } catch (_) {
      // Error already surfaced via state.
    }
  }
}
