// Domain 19 — Flutter Booking API client (parity with web SDK).
import 'dart:convert';
import 'package:http/http.dart' as http;

class BookingLink {
  final String id;
  final String slug;
  final String title;
  final int durationMinutes;
  final String timezone;
  final String status;
  BookingLink({required this.id, required this.slug, required this.title,
    required this.durationMinutes, required this.timezone, required this.status});
  factory BookingLink.fromJson(Map<String, dynamic> j) => BookingLink(
    id: j['id'], slug: j['slug'], title: j['title'],
    durationMinutes: j['durationMinutes'], timezone: j['timezone'], status: j['status'],
  );
}

class Appointment {
  final String id;
  final String linkId;
  final String inviteeName;
  final String startAt;
  final String endAt;
  final String status;
  final String? joinUrl;
  Appointment({required this.id, required this.linkId, required this.inviteeName,
    required this.startAt, required this.endAt, required this.status, this.joinUrl});
  factory Appointment.fromJson(Map<String, dynamic> j) => Appointment(
    id: j['id'], linkId: j['linkId'], inviteeName: j['inviteeName'],
    startAt: j['startAt'], endAt: j['endAt'], status: j['status'], joinUrl: j['joinUrl'],
  );
}

class TimeSlot {
  final String id;
  final String startAt;
  final String endAt;
  final String state;
  TimeSlot({required this.id, required this.startAt, required this.endAt, required this.state});
  factory TimeSlot.fromJson(Map<String, dynamic> j) => TimeSlot(
    id: j['id'], startAt: j['startAt'], endAt: j['endAt'], state: j['state'],
  );
}

class BookingApi {
  final String base;
  BookingApi({this.base = 'https://api.gigvora.com'});

  Future<List<BookingLink>> links() async {
    try {
      final r = await http.get(Uri.parse('$base/api/v1/booking/links'))
        .timeout(const Duration(seconds: 5));
      if (r.statusCode != 200) return [];
      final items = (jsonDecode(r.body)['items'] ?? []) as List;
      return items.map((e) => BookingLink.fromJson(e)).toList();
    } catch (_) { return []; }
  }

  Future<List<Appointment>> appointments({String? status}) async {
    final uri = Uri.parse('$base/api/v1/booking/appointments${status != null ? '?status=$status' : ''}');
    try {
      final r = await http.get(uri).timeout(const Duration(seconds: 5));
      if (r.statusCode != 200) return [];
      final items = (jsonDecode(r.body)['items'] ?? []) as List;
      return items.map((e) => Appointment.fromJson(e)).toList();
    } catch (_) { return []; }
  }

  Future<List<TimeSlot>> availability(String linkId, String from, String to) async {
    final uri = Uri.parse('$base/api/v1/booking/availability?linkId=$linkId&from=$from&to=$to');
    try {
      final r = await http.get(uri).timeout(const Duration(seconds: 5));
      if (r.statusCode != 200) return [];
      final items = (jsonDecode(r.body)['items'] ?? []) as List;
      return items.map((e) => TimeSlot.fromJson(e)).toList();
    } catch (_) { return []; }
  }

  Future<Appointment?> book({required String linkId, required String startAt,
    required String inviteeName, required String inviteeEmail, required String inviteeTimezone}) async {
    try {
      final r = await http.post(Uri.parse('$base/api/v1/booking/appointments'),
        headers: {'content-type': 'application/json'},
        body: jsonEncode({
          'linkId': linkId, 'startAt': startAt, 'inviteeName': inviteeName,
          'inviteeEmail': inviteeEmail, 'inviteeTimezone': inviteeTimezone,
        })).timeout(const Duration(seconds: 8));
      if (r.statusCode >= 400) return null;
      return Appointment.fromJson(jsonDecode(r.body));
    } catch (_) { return null; }
  }
}
