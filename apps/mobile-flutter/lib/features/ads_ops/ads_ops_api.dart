// Domain 72 — Ads Ops mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class AdsOpsApi {
  AdsOpsApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/ads-ops/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> reviews({Map<String, String>? q}) async {
    final uri = Uri.parse('$baseUrl/api/v1/ads-ops/reviews').replace(queryParameters: q ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> claimNext({String queue = 'triage'}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/ads-ops/reviews/claim-next'),
        headers: _h, body: jsonEncode({'queue': queue}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> decide(String reviewId, String decision, String rationale) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/ads-ops/reviews/decide'),
        headers: _h,
        body: jsonEncode({'reviewId': reviewId, 'decision': decision, 'rationale': rationale, 'appealable': 'yes'}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
