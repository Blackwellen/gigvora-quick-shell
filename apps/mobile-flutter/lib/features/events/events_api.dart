// Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups.
// Mobile API client built on the shared Dio provider. Mirrors the web
// envelope contract so route families, filters, counters, and outcomes
// stay consistent across web and mobile.
//
// Mobile-specific affordances:
//   • RSVP / cancel exposed as bottom-sheet quick actions.
//   • Live room chat → sticky bottom composer.
//   • Check-in → camera bottom sheet (QR) or manual.
//   • Speaker / session lists → swipeable stacked cards.
//   • Push notifications: 24h reminder + start-time deep link.
//   • Offline cache: list/detail readable; writes queue with idempotency keys.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class EventsPage {
  final List<Map<String, dynamic>> items;
  final int total;
  final int limit;
  final bool hasMore;
  EventsPage({required this.items, required this.total, required this.limit, required this.hasMore});
}

Map<String, dynamic> _asMap(dynamic v) => Map<String, dynamic>.from(v as Map);
List<Map<String, dynamic>> _asList(dynamic v) =>
    (v as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();

EventsPage _envelope(dynamic data) {
  if (data is List) return EventsPage(items: _asList(data), total: data.length, limit: data.length, hasMore: false);
  final m = _asMap(data);
  final items = _asList(m['items'] ?? const []);
  return EventsPage(
    items: items,
    total: (m['total'] ?? items.length) as int,
    limit: (m['limit'] ?? items.length) as int,
    hasMore: m['hasMore'] == true,
  );
}

class EventsApi {
  EventsApi(this._dio);
  final Dio _dio;

  // Discovery
  Future<EventsPage> list({
    String? q, String? type, String? format, String? status, String? visibility,
    String? hostId, String? groupId, bool? rsvpedByMe, bool? hostedByMe,
    bool? upcoming, bool? past, int page = 1, int pageSize = 20, String sort = 'starts_at',
  }) async {
    final r = await _dio.get('/api/v1/events', queryParameters: {
      'page': page, 'pageSize': pageSize, 'sort': sort,
      if (q != null && q.isNotEmpty) 'q': q,
      if (type != null) 'type': type,
      if (format != null) 'format': format,
      if (status != null) 'status': status,
      if (visibility != null) 'visibility': visibility,
      if (hostId != null) 'hostId': hostId,
      if (groupId != null) 'groupId': groupId,
      if (rsvpedByMe != null) 'rsvpedByMe': rsvpedByMe,
      if (hostedByMe != null) 'hostedByMe': hostedByMe,
      if (upcoming != null) 'upcoming': upcoming,
      if (past != null) 'past': past,
    });
    return _envelope(r.data);
  }
  Future<Map<String, dynamic>> detail(String idOrSlug) async => _asMap((await _dio.get('/api/v1/events/$idOrSlug')).data);

  // Host CRUD + lifecycle
  Future<Map<String, dynamic>> create(Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/events', data: body, options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return _asMap(r.data);
  }
  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> patch) async => _asMap((await _dio.patch('/api/v1/events/$id', data: patch)).data);
  Future<Map<String, dynamic>> transition(String id, String to, {String? reason}) async =>
      _asMap((await _dio.post('/api/v1/events/$id/transition', data: {'to': to, if (reason != null) 'reason': reason})).data);
  Future<void> archive(String id) => _dio.delete('/api/v1/events/$id');

  // RSVP
  Future<Map<String, dynamic>> rsvp(String id, {String status = 'going', int guests = 0, String? note, String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/events/$id/rsvp',
      data: {'status': status, 'guests': guests, if (note != null) 'note': note},
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return _asMap(r.data);
  }
  Future<void> cancelRsvp(String id) => _dio.delete('/api/v1/events/$id/rsvp');
  Future<EventsPage> rsvps(String id) async => _envelope((await _dio.get('/api/v1/events/$id/rsvps')).data);

  // Speakers / sessions
  Future<EventsPage> speakers(String id) async => _envelope((await _dio.get('/api/v1/events/$id/speakers')).data);
  Future<Map<String, dynamic>> addSpeaker(String id, Map<String, dynamic> body) async => _asMap((await _dio.post('/api/v1/events/$id/speakers', data: body)).data);
  Future<EventsPage> sessions(String id) async => _envelope((await _dio.get('/api/v1/events/$id/sessions')).data);
  Future<Map<String, dynamic>> addSession(String id, Map<String, dynamic> body) async => _asMap((await _dio.post('/api/v1/events/$id/sessions', data: body)).data);

  // Live room
  Future<EventsPage> messages(String id, {String? channel}) async =>
      _envelope((await _dio.get('/api/v1/events/$id/messages', queryParameters: {if (channel != null) 'channel': channel})).data);
  Future<Map<String, dynamic>> postMessage(String id, String body, {String channel = 'lobby'}) async =>
      _asMap((await _dio.post('/api/v1/events/$id/messages', data: {'body': body, 'channel': channel})).data);
  Future<Map<String, dynamic>> moderate(String id, String action, String targetId, {String? reason}) async =>
      _asMap((await _dio.post('/api/v1/events/$id/moderate', data: {'action': action, 'targetId': targetId, if (reason != null) 'reason': reason})).data);

  // Check-in / feedback
  Future<Map<String, dynamic>> checkIn(String id, String identityId, {String method = 'qr'}) async =>
      _asMap((await _dio.post('/api/v1/events/$id/checkin', data: {'identityId': identityId, 'method': method})).data);
  Future<EventsPage> checkins(String id) async => _envelope((await _dio.get('/api/v1/events/$id/checkins')).data);
  Future<Map<String, dynamic>> submitFeedback(String id, int rating, {String? comment, int? npsLikely}) async =>
      _asMap((await _dio.post('/api/v1/events/$id/feedback', data: {'rating': rating, if (comment != null) 'comment': comment, if (npsLikely != null) 'npsLikely': npsLikely})).data);
  Future<EventsPage> feedback(String id) async => _envelope((await _dio.get('/api/v1/events/$id/feedback')).data);

  // Analytics
  Future<Map<String, dynamic>> summary(String id) async => _asMap((await _dio.get('/api/v1/events/$id/summary')).data);
}

final eventsApiProvider = Provider<EventsApi>((ref) => EventsApi(ref.watch(apiClientProvider)));
