import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/shell/shell_repository.dart';

void main() {
  test('ShellBootstrap.fromJson parses nested shapes', () {
    final b = ShellBootstrap.fromJson({
      'orgs': [{'id': '1', 'slug': 'acme', 'name': 'Acme', 'plan': 'team', 'role': 'admin'}],
      'savedViews': [{'id': 'v1', 'label': 'Pipeline', 'route': '/p', 'pinned': true}],
      'recents': [{'id': 'r1', 'kind': 'job', 'label': 'X', 'route': '/x', 'visitedAt': '2026-01-01'}],
      'prefs': {'activeRole': 'professional', 'activeOrgId': '1'},
    });
    expect(b.orgs.first.name, 'Acme');
    expect(b.savedViews.first.pinned, true);
    expect(b.recents.first.kind, 'job');
    expect(b.prefs.activeRole, 'professional');
  });

  test('ShellBootstrap.empty is safe default for offline mode', () {
    final b = ShellBootstrap.empty();
    expect(b.orgs, isEmpty);
    expect(b.prefs.activeRole, 'user');
  });
}
