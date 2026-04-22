// Domain 73 — Verification & Compliance mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class VerificationComplianceApi {
  VerificationComplianceApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/verification-compliance/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> cases({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/verification-compliance/cases').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> claimNext({String queue = 'triage'}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/verification-compliance/cases/claim-next'),
        headers: _h, body: jsonEncode({'queue': queue}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> decide(String caseId, String decision, String rationale, {int? durationDays}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/verification-compliance/cases/decide'),
        headers: _h,
        body: jsonEncode({
          'caseId': caseId, 'decision': decision, 'rationale': rationale, 'appealable': 'yes',
          if (durationDays != null) 'durationDays': durationDays,
        }));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
