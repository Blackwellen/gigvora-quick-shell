// Domain 71 — Trust & Safety / ML mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class TrustSafetyMlApi {
  TrustSafetyMlApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/trust-safety-ml/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> cases({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/trust-safety-ml/cases').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> claimNext({String queue = 'triage'}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/trust-safety-ml/cases/claim-next'),
        headers: _h, body: jsonEncode({'queue': queue}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> decide(String caseId, String decision, String rationale) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/trust-safety-ml/cases/decide'),
        headers: _h, body: jsonEncode({'caseId': caseId, 'decision': decision, 'rationale': rationale, 'appealable': 'yes'}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
