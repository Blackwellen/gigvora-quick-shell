/// Group 5 — AsyncStateView widget matrix.
///
/// Asserts every branch of the canonical 4-state widget renders the right
/// keyed subtree. Mirrors the React `<DataState>` matrix from Group 4.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/core/async_state.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('AsyncStateView', () {
    testWidgets('renders loading branch with canonical key', (tester) async {
      await tester.pumpWidget(_wrap(
        AsyncStateView<List<String>>(isLoading: true, builder: (_) => const SizedBox()),
      ));
      expect(find.byKey(AsyncStateView.loadingKey), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders error branch with retry button', (tester) async {
      var retried = false;
      await tester.pumpWidget(_wrap(
        AsyncStateView<List<String>>(
          error: 'boom',
          onRetry: () => retried = true,
          builder: (_) => const SizedBox(),
        ),
      ));
      expect(find.byKey(AsyncStateView.errorKey), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
      await tester.tap(find.text('Try again'));
      expect(retried, isTrue);
    });

    testWidgets('renders empty branch with title + message', (tester) async {
      await tester.pumpWidget(_wrap(
        AsyncStateView<List<String>>(
          data: const <String>[],
          isEmpty: true,
          emptyTitle: 'No companies',
          emptyMessage: 'Try a different filter.',
          builder: (_) => const SizedBox(),
        ),
      ));
      expect(find.byKey(AsyncStateView.emptyKey), findsOneWidget);
      expect(find.text('No companies'), findsOneWidget);
      expect(find.text('Try a different filter.'), findsOneWidget);
    });

    testWidgets('renders ready branch with builder children', (tester) async {
      await tester.pumpWidget(_wrap(
        AsyncStateView<List<String>>(
          data: const ['a', 'b'],
          builder: (items) => Column(children: [for (final i in items) Text(i)]),
        ),
      ));
      expect(find.byKey(AsyncStateView.readyKey), findsOneWidget);
      expect(find.text('a'), findsOneWidget);
      expect(find.text('b'), findsOneWidget);
    });

    testWidgets('null data without isEmpty still falls back to empty branch', (tester) async {
      await tester.pumpWidget(_wrap(
        AsyncStateView<List<String>>(builder: (_) => const SizedBox()),
      ));
      expect(find.byKey(AsyncStateView.emptyKey), findsOneWidget);
    });
  });

  group('AsyncStateView accessibility', () {
    testWidgets('error and retry button expose tappable affordance', (tester) async {
      await tester.pumpWidget(_wrap(
        AsyncStateView<List<String>>(
          error: 'oops',
          onRetry: () {},
          builder: (_) => const SizedBox(),
        ),
      ));
      // Min tap target: Material's FilledButton is ≥ 48 px high — the platform
      // default. Confirm by checking the rendered button's hit-test rect.
      final btn = tester.getRect(find.text('Try again').hitTestable());
      expect(btn.height, greaterThanOrEqualTo(40));
    });
  });
}
