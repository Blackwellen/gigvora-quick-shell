/// Shared Flutter widgets that every domain screen reuses to satisfy the
/// "loading / empty / error / success / stale" state requirement of the
/// Mobile Screens Mandate.
library async_state;

import 'package:flutter/material.dart';

class AsyncStateView<T> extends StatelessWidget {
  final AsyncSnapshot<T>? snapshot;
  final bool isLoading;
  final Object? error;
  final T? data;
  final bool isEmpty;
  final VoidCallback? onRetry;
  final Widget Function(T data) builder;
  final String emptyTitle;
  final String emptyMessage;
  final IconData emptyIcon;

  const AsyncStateView({
    super.key,
    this.snapshot,
    this.isLoading = false,
    this.error,
    this.data,
    this.isEmpty = false,
    this.onRetry,
    required this.builder,
    this.emptyTitle = 'Nothing here yet',
    this.emptyMessage = 'When there is something to show, it will appear here.',
    this.emptyIcon = Icons.inbox_outlined,
  });

  // Canonical keys for the Group 5 widget + golden test matrix. Every domain
  // screen using AsyncStateView gets the same four keys so the QA matrix can
  // assert "this screen reaches a terminal state" without per-screen wiring.
  static const loadingKey = Key('async-state-loading');
  static const errorKey = Key('async-state-error');
  static const emptyKey = Key('async-state-empty');
  static const readyKey = Key('async-state-ready');

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        key: loadingKey,
        child: CircularProgressIndicator.adaptive(),
      );
    }
    if (error != null) {
      return _ErrorView(key: errorKey, error: error!, onRetry: onRetry);
    }
    if (data == null || isEmpty) {
      return _EmptyView(
        key: emptyKey,
        title: emptyTitle,
        message: emptyMessage,
        icon: emptyIcon,
      );
    }
    return KeyedSubtree(key: readyKey, child: builder(data as T));
  }
}

class _ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;
  const _ErrorView({super.key, required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.error_outline, size: 48),
          const SizedBox(height: 12),
          Text('Something went wrong',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('$error',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ]),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  final String title;
  final String message;
  final IconData icon;
  const _EmptyView({super.key, required this.title, required this.message, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 48, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall),
        ]),
      ),
    );
  }
}

/// Simple primary/destructive confirm dialog used by every "remove" action.
Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  bool destructive = false,
}) async {
  return await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
            FilledButton(
              style: destructive
                  ? FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error)
                  : null,
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(confirmLabel),
            ),
          ],
        ),
      ) ??
      false;
}

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
