// Domain 74 — Super Admin Command Center mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class SuperAdminCommandCenterApi {
  SuperAdminCommandCenterApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/super-admin-command-center/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> flags({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/super-admin-command-center/flags').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> toggleFlag(String id, bool enabled) async {
    final r = await http.patch(Uri.parse('$baseUrl/api/v1/super-admin-command-center/flags/toggle'),
        headers: _h, body: jsonEncode({'id': id, 'enabled': enabled}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<List<dynamic>> incidents({String? status}) async {
    final uri = Uri.parse('$baseUrl/api/v1/super-admin-command-center/incidents')
        .replace(queryParameters: status != null ? {'status': status} : null);
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as List<dynamic>;
  }
}
