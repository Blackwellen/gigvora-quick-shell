import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'overlays_api.dart';

final openOverlaysProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(overlaysApiProvider).listOpen();
});

final activeWorkflowsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(overlaysApiProvider).listWorkflows();
});

final workflowDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async {
  return ref.read(overlaysApiProvider).getWorkflow(id);
});

final detachedWindowsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(overlaysApiProvider).listWindows();
});
