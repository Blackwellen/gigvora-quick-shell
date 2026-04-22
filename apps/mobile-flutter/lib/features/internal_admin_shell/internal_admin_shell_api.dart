// Domain 66 — Internal Admin Shell mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class IasApi {
  IasApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/internal-admin-shell/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> queues({String? workspaceSlug, String? domain}) async {
    final qs = <String, String>{};
    if (workspaceSlug != null) qs['workspaceSlug'] = workspaceSlug;
    if (domain != null) qs['domain'] = domain;
    final uri = Uri.parse('$baseUrl/api/v1/internal-admin-shell/queues').replace(queryParameters: qs);
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> queueJump({String? workspaceSlug, String? domain, String? priority}) async {
    final r = await http.post(
      Uri.parse('$baseUrl/api/v1/internal-admin-shell/queue-jump'),
      headers: _h,
      body: jsonEncode({
        if (workspaceSlug != null) 'workspaceSlug': workspaceSlug,
        if (domain != null) 'domain': domain,
        if (priority != null) 'priority': priority,
      }),
    );
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
