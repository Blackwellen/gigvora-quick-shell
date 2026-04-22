import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'network_api.dart';

/// Riverpod state for Domain 10 — Network.

final networkRequestsProvider = FutureProvider.autoDispose
    .family<NetworkPage, ({String direction, String status})>((ref, args) async {
  final api = ref.read(networkApiProvider);
  return args.direction == 'incoming'
      ? api.incoming(status: args.status)
      : api.outgoing(status: args.status);
});

final networkConnectionsProvider =
    FutureProvider.autoDispose<NetworkPage>((ref) => ref.read(networkApiProvider).connections());

final networkSuggestionsProvider =
    FutureProvider.autoDispose<NetworkPage>((ref) => ref.read(networkApiProvider).suggestions());

final networkBlocksProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) => ref.read(networkApiProvider).blocks());

final networkCountProvider =
    FutureProvider.autoDispose<int>((ref) => ref.read(networkApiProvider).count());

final networkDegreeProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) =>
        ref.read(networkApiProvider).degree(id));
