// Domain 67 — Customer Service mobile API.
import 'dart:convert';
import 'package:http/http.dart' as http;

class CsApi {
  CsApi(this.baseUrl, {this.token});
  final String baseUrl;
  final String? token;
  Map<String, String> get _h => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> overview() async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/customer-service/overview'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> tickets({Map<String, String>? filter}) async {
    final uri = Uri.parse('$baseUrl/api/v1/customer-service/tickets')
        .replace(queryParameters: filter ?? const {});
    final r = await http.get(uri, headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> ticket(String id) async {
    final r = await http.get(Uri.parse('$baseUrl/api/v1/customer-service/tickets/$id'), headers: _h);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/customer-service/tickets'),
        headers: _h, body: jsonEncode(body));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> postMessage(String ticketId, String body, {String visibility = 'public'}) async {
    final r = await http.post(Uri.parse('$baseUrl/api/v1/customer-service/messages'),
        headers: _h, body: jsonEncode({'ticketId': ticketId, 'body': body, 'visibility': visibility}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> transition(String ticketId, String to, {String? note}) async {
    final r = await http.patch(Uri.parse('$baseUrl/api/v1/customer-service/tickets/transition'),
        headers: _h, body: jsonEncode({'ticketId': ticketId, 'to': to, if (note != null) 'note': note}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }
}
