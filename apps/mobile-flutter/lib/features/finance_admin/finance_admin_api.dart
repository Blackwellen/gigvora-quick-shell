// Domain 68 — Finance Admin mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class FinanceAdminApi {
  FinanceAdminApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/finance-admin/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> refunds({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/finance-admin/refunds').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> transitionRefund(String id, String to, {String? note}) async {
    final r = await http.patch(Uri.parse('$baseUrl/api/v1/finance-admin/refunds/transition'),
        headers: _h, body: jsonEncode({'refundId': id, 'to': to, if (note != null) 'note': note}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> releaseHold(String id, {String? note}) async {
    final r = await http.patch(Uri.parse('$baseUrl/api/v1/finance-admin/holds/release'),
        headers: _h, body: jsonEncode({'holdId': id, if (note != null) 'note': note}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
