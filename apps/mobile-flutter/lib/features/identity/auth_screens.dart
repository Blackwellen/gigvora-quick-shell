import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'identity_providers.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});
  @override
  ConsumerState<SignInScreen> createState() => _State();
}

class _State extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  final _pwd = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() { _email.dispose(); _pwd.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() { _busy = true; _err = null; });
    try {
      final ok = await ref.read(authControllerProvider.notifier)
          .login(email: _email.text.trim(), password: _pwd.text);
      if (!mounted) return;
      if (ok) {
        context.go('/feed');
      } else {
        context.push('/auth/mfa');
      }
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            TextField(controller: _pwd, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            if (_err != null) ...[
              const SizedBox(height: 12),
              Text(_err!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Sign in'),
            ),
            const SizedBox(height: 12),
            TextButton(onPressed: () => context.push('/auth/sign-up'), child: const Text('Create an account')),
            TextButton(onPressed: () => context.push('/auth/forgot'), child: const Text('Forgot password?')),
          ]),
        ),
      ),
    );
  }
}

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});
  @override
  ConsumerState<SignUpScreen> createState() => _SignUpState();
}

class _SignUpState extends ConsumerState<SignUpScreen> {
  final _email = TextEditingController();
  final _pwd = TextEditingController();
  final _name = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() { _email.dispose(); _pwd.dispose(); _name.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (_pwd.text.length < 8) { setState(() => _err = 'Password must be at least 8 characters'); return; }
    setState(() { _busy = true; _err = null; });
    try {
      await ref.read(authControllerProvider.notifier).signup(
        email: _email.text.trim(), password: _pwd.text,
        displayName: _name.text.trim().isEmpty ? null : _name.text.trim(),
      );
      if (mounted) context.go('/feed');
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Display name')),
            const SizedBox(height: 12),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            TextField(controller: _pwd, decoration: const InputDecoration(labelText: 'Password (min 8)'), obscureText: true),
            if (_err != null) ...[
              const SizedBox(height: 12),
              Text(_err!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create account'),
            ),
          ]),
        ),
      ),
    );
  }
}

class MfaChallengeScreen extends ConsumerStatefulWidget {
  const MfaChallengeScreen({super.key});
  @override
  ConsumerState<MfaChallengeScreen> createState() => _MfaState();
}

class _MfaState extends ConsumerState<MfaChallengeScreen> {
  final _code = TextEditingController();
  final _email = TextEditingController();
  final _pwd = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() { _code.dispose(); _email.dispose(); _pwd.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() { _busy = true; _err = null; });
    try {
      final ok = await ref.read(authControllerProvider.notifier).login(
        email: _email.text.trim(), password: _pwd.text, mfaCode: _code.text.trim(),
      );
      if (mounted && ok) context.go('/feed');
    } catch (e) {
      setState(() => _err = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Two-factor')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Text('Enter the 6-digit code from your authenticator app, plus your email and password to confirm.'),
            const SizedBox(height: 12),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 8),
            TextField(controller: _pwd, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
            const SizedBox(height: 8),
            TextField(controller: _code, decoration: const InputDecoration(labelText: '6-digit code'), keyboardType: TextInputType.number, maxLength: 6),
            if (_err != null) Text(_err!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Verify'),
            ),
          ]),
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _FState();
}

class _FState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _busy = false;
  String? _msg;

  @override
  void dispose() { _email.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() { _busy = true; _msg = null; });
    try {
      await ref.read(identityApiProvider).forgotPassword(_email.text.trim());
      setState(() => _msg = 'If an account exists, a reset link has been sent.');
    } catch (e) {
      setState(() => _msg = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
          if (_msg != null) ...[const SizedBox(height: 12), Text(_msg!)],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Send reset link'),
          ),
        ]),
      )),
    );
  }
}
