/// Domain 48 — User Dashboard API client (Flutter parity).
import 'dart:convert';
import 'package:http/http.dart' as http;

class UserDashboardApi {
  UserDashboardApi(this.baseUrl, {this.authToken});
  final String baseUrl;
  final String? authToken;

  Map<String, String> get _headers => {
        'content-type': 'application/json',
        if (authToken != null) 'authorization': 'Bearer $authToken',
      };

  Future<Map<String, dynamic>> overview({String role = 'user', bool refresh = false}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/user-dashboard/overview?role=$role${refresh ? '&refresh=true' : ''}'),
      headers: _headers,
    );
    if (res.statusCode != 200) throw Exception('overview failed: ${res.statusCode}');
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> listActions({String role = 'user', String status = 'pending'}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/v1/user-dashboard/actions?role=$role&status=$status'),
      headers: _headers,
    );
    if (res.statusCode != 200) throw Exception('listActions failed');
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<void> complete(String id) async {
    final res = await http.post(Uri.parse('$baseUrl/api/v1/user-dashboard/actions/$id/complete'), headers: _headers);
    if (res.statusCode >= 400) throw Exception('complete failed');
  }

  Future<void> dismiss(String id) async {
    final res = await http.post(Uri.parse('$baseUrl/api/v1/user-dashboard/actions/$id/dismiss'), headers: _headers);
    if (res.statusCode >= 400) throw Exception('dismiss failed');
  }

  Future<void> snooze(String id, DateTime until) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/api/v1/user-dashboard/actions/$id'),
      headers: _headers,
      body: jsonEncode({'status': 'snoozed', 'snoozeUntil': until.toIso8601String()}),
    );
    if (res.statusCode >= 400) throw Exception('snooze failed');
  }
}
