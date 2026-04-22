import 'package:flutter/material.dart';

class SignInScreenV2 extends StatefulWidget {
  const SignInScreenV2({super.key});
  @override
  State<SignInScreenV2> createState() => _SignInScreenV2State();
}

class _SignInScreenV2State extends State<SignInScreenV2> {
  final _email = TextEditingController();
  final _pw = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() { _busy = false; _error = _email.text.contains('@') ? null : 'Enter a valid email'; });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Sign in')),
    body: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder())),
        const SizedBox(height: 12),
        TextField(controller: _pw, obscureText: true, decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder())),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: Colors.red))),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: FilledButton(onPressed: _busy ? null : _submit, child: Text(_busy ? 'Signing in…' : 'Sign in'))),
        const SizedBox(height: 8),
        TextButton(onPressed: () {}, child: const Text('Forgot password?')),
        const Divider(),
        OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.g_mobiledata), label: const Text('Continue with Google')),
        const SizedBox(height: 8),
        OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.code), label: const Text('Continue with GitHub')),
      ]),
    ),
  );
}

class SessionsScreenV2 extends StatelessWidget {
  const SessionsScreenV2({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Active sessions')),
    body: ListView(children: const [
      ListTile(leading: Icon(Icons.phone_iphone), title: Text('iPhone 15 Pro'), subtitle: Text('Active now · 192.0.2.1'), trailing: Chip(label: Text('This device'))),
      ListTile(leading: Icon(Icons.laptop_mac), title: Text('MacBook Pro'), subtitle: Text('2 hours ago · 198.51.100.4'), trailing: TextButton(onPressed: null, child: Text('Revoke'))),
    ]),
  );
}

class MfaSetupScreen extends StatelessWidget {
  const MfaSetupScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Two-factor')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      ListTile(leading: Icon(Icons.qr_code), title: Text('Authenticator app'), subtitle: Text('TOTP')),
      ListTile(leading: Icon(Icons.fingerprint), title: Text('WebAuthn / Passkeys')),
      ListTile(leading: Icon(Icons.sms), title: Text('SMS'), subtitle: Text('Backup only')),
      Divider(),
      ListTile(leading: Icon(Icons.vpn_key), title: Text('Backup codes')),
    ]),
  );
}
