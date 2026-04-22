import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'internal_admin_login_terminal_api.dart';

/// Domain 65 — Internal Admin Login Terminal mobile screen.
///
/// Mobile affordances:
///   • Top env-picker chip row (sticky).
///   • Email + MFA stacked card (sticky bottom CTA "Sign in").
///   • Tabs: Sessions | Attempts.
class InternalAdminLoginTerminalScreen extends ConsumerStatefulWidget {
  const InternalAdminLoginTerminalScreen({super.key});
  @override
  ConsumerState<InternalAdminLoginTerminalScreen> createState() => _State();
}

class _State extends ConsumerState<InternalAdminLoginTerminalScreen> {
  List<dynamic> _envs = const [];
  List<dynamic> _sessions = const [];
  String? _selectedEnv;
  String _email = '';
  String _mfa = '';
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = InternalAdminLoginTerminalApi(ref.read(apiClientProvider));
      _envs = await api.environments();
      _sessions = await api.mySessions();
      _selectedEnv ??= _envs.isNotEmpty ? (_envs.first as Map)['slug'] as String : null;
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _signIn() async {
    if (_selectedEnv == null || _email.isEmpty) return;
    try {
      final api = InternalAdminLoginTerminalApi(ref.read(apiClientProvider));
      final r = await api.login({
        'email': _email, 'environmentSlug': _selectedEnv,
        'credentialVerified': true,
        if (_mfa.isNotEmpty) 'mfaCode': _mfa,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Session ${r['status']} for ${r['environmentSlug']}')));
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Sign-in failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Login Terminal')),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null ? Center(child: Text('Error: $_error'))
        : Column(children: [
            Container(height: 56, padding: const EdgeInsets.symmetric(horizontal: 12),
              child: ListView(scrollDirection: Axis.horizontal,
                children: _envs.map<Widget>((e) {
                  final m = Map<String, dynamic>.from(e as Map);
                  final selected = _selectedEnv == m['slug'];
                  final risk = m['riskBand'] as String? ?? 'low';
                  return Padding(padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      selected: selected,
                      label: Text('${m['label']} • $risk'),
                      onSelected: (_) => setState(() => _selectedEnv = m['slug'] as String?),
                    ));
                }).toList())),
            Padding(padding: const EdgeInsets.all(16),
              child: Card(child: Padding(padding: const EdgeInsets.all(16),
                child: Column(children: [
                  TextField(decoration: const InputDecoration(labelText: 'Operator email'),
                    onChanged: (v) => _email = v.trim()),
                  const SizedBox(height: 12),
                  TextField(decoration: const InputDecoration(labelText: 'MFA code (6 digits)'),
                    keyboardType: TextInputType.number, maxLength: 6,
                    onChanged: (v) => _mfa = v.trim()),
                  const SizedBox(height: 8),
                  SizedBox(width: double.infinity,
                    child: FilledButton(onPressed: _signIn, child: const Text('Sign in'))),
                ])))),
            const Divider(),
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Align(alignment: Alignment.centerLeft,
                child: Text('Active sessions', style: Theme.of(context).textTheme.titleSmall))),
            Expanded(child: RefreshIndicator(onRefresh: _refresh,
              child: ListView(children: _sessions.map((s) {
                final m = Map<String, dynamic>.from(s as Map);
                return ListTile(
                  leading: const Icon(Icons.security_outlined),
                  title: Text('${m['environmentSlug']} • ${m['status']}'),
                  subtitle: Text('Expires ${m['expiresAt']}'));
              }).toList()))),
          ]),
    );
  }
}
