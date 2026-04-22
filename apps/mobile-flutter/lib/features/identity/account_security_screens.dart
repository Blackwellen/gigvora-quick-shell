import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'identity_api.dart';
import 'identity_providers.dart';

class AccountSecurityScreen extends ConsumerWidget {
  const AccountSecurityScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mfa = ref.watch(mfaFactorsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Account security')),
      body: ListView(children: [
        ListTile(
          leading: const Icon(Icons.devices),
          title: const Text('Active sessions'),
          subtitle: const Text('Devices currently signed in'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/account/sessions'),
        ),
        const Divider(),
        Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Text('Two-factor authentication', style: Theme.of(context).textTheme.titleMedium)),
        AsyncStateView<Map<String, dynamic>>(
          isLoading: mfa.isLoading,
          error: mfa.hasError ? mfa.error : null,
          data: mfa.value,
          isEmpty: ((mfa.value?['items'] as List?) ?? const []).isEmpty,
          onRetry: () => ref.invalidate(mfaFactorsProvider),
          emptyTitle: 'No factors enrolled',
          emptyMessage: 'Add an authenticator app to protect your account.',
          builder: (data) {
            final items = (data['items'] as List).cast<Map>();
            return Column(children: items.map((f) => ListTile(
              leading: Icon(f['type'] == 'totp' ? Icons.qr_code_2 : Icons.sms),
              title: Text(f['label']?.toString() ?? f['type'].toString()),
              subtitle: Text(f['status']?.toString() ?? '—'),
            )).toList());
          },
        ),
        Padding(padding: const EdgeInsets.all(16),
          child: FilledButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Enroll authenticator'),
            onPressed: () => showModalBottomSheet(
              context: context, isScrollControlled: true,
              builder: (_) => const _EnrollMfaSheet(),
            ).then((_) => ref.invalidate(mfaFactorsProvider)),
          ),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout),
          title: const Text('Sign out'),
          onTap: () async {
            final ok = await confirmAction(context, title: 'Sign out?', message: 'You will need to sign in again.', confirmLabel: 'Sign out');
            if (!ok) return;
            await ref.read(authControllerProvider.notifier).logout();
            if (context.mounted) context.go('/auth/sign-in');
          },
        ),
      ]),
    );
  }
}

class _EnrollMfaSheet extends ConsumerStatefulWidget {
  const _EnrollMfaSheet();
  @override
  ConsumerState<_EnrollMfaSheet> createState() => _EnrollState();
}

class _EnrollState extends ConsumerState<_EnrollMfaSheet> {
  final _code = TextEditingController();
  String? _factorId;
  String? _secret;
  bool _busy = false;
  String? _err;

  @override
  void dispose() { _code.dispose(); super.dispose(); }

  Future<void> _begin() async {
    setState(() { _busy = true; _err = null; });
    try {
      final r = await ref.read(identityApiProvider).enrollMfa('totp', label: 'Mobile');
      setState(() { _factorId = r['id']?.toString(); _secret = r['secret']?.toString(); });
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    if (_factorId == null) return;
    setState(() { _busy = true; _err = null; });
    try {
      await ref.read(identityApiProvider).verifyMfa(_factorId!, _code.text.trim());
      if (mounted) Navigator.of(context).pop();
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
        Text('Enroll authenticator', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        if (_secret == null) FilledButton(
          onPressed: _busy ? null : _begin,
          child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Generate secret'),
        ) else ...[
          const Text('Secret (paste into authenticator app):'),
          const SizedBox(height: 4),
          SelectableText(_secret!, style: const TextStyle(fontFamily: 'monospace')),
          const SizedBox(height: 12),
          TextField(controller: _code, decoration: const InputDecoration(labelText: '6-digit code'),
              keyboardType: TextInputType.number, maxLength: 6),
          if (_err != null) Text(_err!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _busy ? null : _verify,
            child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Verify and enable'),
          ),
        ],
      ]),
    );
  }
}

class SessionsScreen extends ConsumerWidget {
  const SessionsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(sessionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Sessions')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(sessionsProvider),
        child: AsyncStateView<Map<String, dynamic>>(
          isLoading: async.isLoading,
          error: async.hasError ? async.error : null,
          data: async.value,
          isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
          onRetry: () => ref.invalidate(sessionsProvider),
          builder: (data) {
            final items = (data['items'] as List).cast<Map>();
            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final s = items[i];
                final active = s['status'] == 'active';
                return ListTile(
                  leading: Icon(active ? Icons.check_circle : Icons.cancel_outlined,
                      color: active ? Colors.green : null),
                  title: Text(s['deviceLabel']?.toString() ?? s['userAgent']?.toString() ?? 'Session'),
                  subtitle: Text('${s['ip'] ?? '—'} · last seen ${s['lastSeenAt'] ?? '—'}'),
                  trailing: active
                      ? IconButton(
                          icon: const Icon(Icons.logout),
                          onPressed: () async {
                            final ok = await confirmAction(context,
                                title: 'Revoke session?',
                                message: 'This will sign out that device.',
                                confirmLabel: 'Revoke', destructive: true);
                            if (!ok) return;
                            await ref.read(identityApiProvider).revokeSession(s['id'].toString());
                            ref.invalidate(sessionsProvider);
                          },
                        )
                      : null,
                );
              },
            );
          },
        ),
      ),
    );
  }
}
