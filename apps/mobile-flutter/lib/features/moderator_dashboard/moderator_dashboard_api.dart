// Domain 70 — Moderator Dashboard mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class ModeratorDashboardApi {
  ModeratorDashboardApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/moderator-dashboard/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> items({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/moderator-dashboard/items').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> claimNext({String queue = 'triage'}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/moderator-dashboard/items/claim-next'),
        headers: _h, body: jsonEncode({'queue': queue}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> act(String itemId, String action, String rationale) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/moderator-dashboard/items/act'),
        headers: _h, body: jsonEncode({'itemId': itemId, 'action': action, 'rationale': rationale, 'appealable': 'yes'}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
