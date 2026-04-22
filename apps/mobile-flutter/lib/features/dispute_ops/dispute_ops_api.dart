// Domain 69 — Dispute Ops mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class DisputeOpsApi {
  DisputeOpsApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/dispute-ops/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> cases({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/dispute-ops/cases').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> caseDetail(String id) async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/dispute-ops/cases/$id'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> claimNext({String queue = 'triage'}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/dispute-ops/cases/claim-next'),
        headers: _h, body: jsonEncode({'queue': queue}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> transition(String caseId, String to, {String? note}) async {
    final r = await http.patch(Uri.parse('$baseUrl/api/v1/dispute-ops/cases/transition'),
        headers: _h, body: jsonEncode({'caseId': caseId, 'to': to, if (note != null) 'note': note}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
