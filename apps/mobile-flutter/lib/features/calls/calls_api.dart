// Domain 18 — Flutter Calls API client (parity with web SDK).
import 'dart:convert';
import 'package:http/http.dart' as http;

class CallRecord {
  final String id;
  final String kind;
  final String status;
  final String? contextLabel;
  final String? scheduledAt;
  final int? durationSeconds;
  CallRecord({required this.id, required this.kind, required this.status,
    this.contextLabel, this.scheduledAt, this.durationSeconds});
  factory CallRecord.fromJson(Map<String, dynamic> j) => CallRecord(
    id: j['id'], kind: j['kind'], status: j['status'],
    contextLabel: j['contextLabel'], scheduledAt: j['scheduledAt'],
    durationSeconds: j['durationSeconds'],
  );
}

class PresenceSnapshot {
  final String userId;
  final String state;
  final String? customStatus;
  PresenceSnapshot({required this.userId, required this.state, this.customStatus});
  factory PresenceSnapshot.fromJson(Map<String, dynamic> j) =>
    PresenceSnapshot(userId: j['userId'], state: j['state'], customStatus: j['customStatus']);
}

class CallsApi {
  final String base;
  CallsApi({this.base = 'https://api.gigvora.com'});

  Future<List<CallRecord>> list({String? status}) async {
    final uri = Uri.parse('$base/api/v1/calls${status != null ? '?status=$status' : ''}');
    try {
      final r = await http.get(uri).timeout(const Duration(seconds: 5));
      if (r.statusCode != 200) return [];
      final body = jsonDecode(r.body);
      final items = (body['items'] ?? []) as List;
      return items.map((e) => CallRecord.fromJson(e)).toList();
    } catch (_) { return []; }
  }

  Future<List<PresenceSnapshot>> presence(List<String> userIds) async {
    final uri = Uri.parse('$base/api/v1/calls/presence/snapshot?userIds=${userIds.join(',')}');
    try {
      final r = await http.get(uri).timeout(const Duration(seconds: 5));
      if (r.statusCode != 200) return [];
      return (jsonDecode(r.body) as List).map((e) => PresenceSnapshot.fromJson(e)).toList();
    } catch (_) { return userIds.map((id) => PresenceSnapshot(userId: id, state: 'offline')).toList(); }
  }
}
