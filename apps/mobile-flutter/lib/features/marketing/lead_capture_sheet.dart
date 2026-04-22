import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/async_state.dart';
import 'marketing_api.dart';

class LeadCaptureSheet extends ConsumerStatefulWidget {
  final String? sourcePage;
  final String? sourceCta;
  const LeadCaptureSheet({super.key, this.sourcePage, this.sourceCta});
  @override
  ConsumerState<LeadCaptureSheet> createState() => _State();
}

class _State extends ConsumerState<LeadCaptureSheet> {
  final _email = TextEditingController();
  final _name = TextEditingController();
  final _company = TextEditingController();
  final _useCase = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() {
    _email.dispose(); _name.dispose(); _company.dispose(); _useCase.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _err = 'Enter a valid email');
      return;
    }
    setState(() { _busy = true; _err = null; });
    try {
      final api = ref.read(marketingApiProvider);
      await api.createLead(
        email: email,
        fullName: _name.text.trim().isEmpty ? null : _name.text.trim(),
        company: _company.text.trim().isEmpty ? null : _company.text.trim(),
        useCase: _useCase.text.trim().isEmpty ? null : _useCase.text.trim(),
        sourcePage: widget.sourcePage,
        sourceCta: widget.sourceCta,
        idempotencyKey: 'lead-${DateTime.now().millisecondsSinceEpoch}-$email',
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      showSnack(context, 'Thanks — we will be in touch.');
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + inset),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: Theme.of(context).dividerColor, borderRadius: BorderRadius.circular(2))),
        Text('Talk to sales', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        TextField(controller: _email, decoration: const InputDecoration(labelText: 'Work email *'), keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 8),
        TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
        const SizedBox(height: 8),
        TextField(controller: _company, decoration: const InputDecoration(labelText: 'Company')),
        const SizedBox(height: 8),
        TextField(controller: _useCase, decoration: const InputDecoration(labelText: 'What are you trying to solve?'), maxLines: 3),
        if (_err != null) ...[
          const SizedBox(height: 8),
          Text(_err!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Submit'),
        ),
      ]),
    );
  }
}

class NewsletterSheet extends ConsumerStatefulWidget {
  const NewsletterSheet({super.key});
  @override
  ConsumerState<NewsletterSheet> createState() => _NState();
}

class _NState extends ConsumerState<NewsletterSheet> {
  final _email = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() { _email.dispose(); super.dispose(); }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _err = 'Enter a valid email');
      return;
    }
    setState(() { _busy = true; _err = null; });
    try {
      await ref.read(marketingApiProvider).subscribeNewsletter(
            email: email,
            idempotencyKey: 'nl-${DateTime.now().millisecondsSinceEpoch}-$email',
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      showSnack(context, 'Check your inbox to confirm.');
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + inset),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Subscribe', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
        if (_err != null) ...[
          const SizedBox(height: 8),
          Text(_err!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Subscribe'),
        ),
      ]),
    );
  }
}

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
