// Domain 17 — Calendar API client.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class CalendarApi {
  CalendarApi(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> myCalendars() async {
    final r = await _dio.get('/api/v1/calendar/calendars');
    final data = r.data;
    final list = data is List ? data : ((data as Map)['items'] as List? ?? const []);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> events({DateTime? from, DateTime? to, String? calendarId}) async {
    final r = await _dio.get('/api/v1/calendar/events', queryParameters: {
      if (from != null) 'from': from.toUtc().toIso8601String(),
      if (to != null)   'to':   to.toUtc().toIso8601String(),
      if (calendarId != null) 'calendarId': calendarId,
    });
    final data = r.data;
    final list = data is List ? data : ((data as Map)['items'] as List? ?? const []);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> getEvent(String id) async {
    final r = await _dio.get('/api/v1/calendar/events/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> createEvent(Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/calendar/events', data: body,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> updateEvent(String id, Map<String, dynamic> patch) async {
    final r = await _dio.patch('/api/v1/calendar/events/$id', data: patch);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> deleteEvent(String id) => _dio.delete('/api/v1/calendar/events/$id');

  Future<Map<String, dynamic>> bestTime(Map<String, dynamic> body) async {
    final r = await _dio.post('/api/v1/calendar/ml/best-meeting-time', data: body);
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final calendarApiProvider = Provider<CalendarApi>((ref) => CalendarApi(ref.watch(apiClientProvider)));

final calendarEventsProvider = FutureProvider.autoDispose
    .family<List<Map<String, dynamic>>, ({DateTime from, DateTime to})>((ref, range) {
  return ref.watch(calendarApiProvider).events(from: range.from, to: range.to);
});

final calendarEventProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, id) => ref.watch(calendarApiProvider).getEvent(id));
