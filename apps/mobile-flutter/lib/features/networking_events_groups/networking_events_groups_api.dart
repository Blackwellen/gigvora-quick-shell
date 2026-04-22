/// Networking + Speed Networking + Events + Groups — typed Dio client.
/// Mirrors the web SDK envelopes.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/api_client.dart';

class NetworkingEventsGroupsApi {
  NetworkingEventsGroupsApi(this._dio);
  final Dio _dio;
  static const _root = '/api/v1/networking-events-groups';

  // Rooms
  Future<List<dynamic>> rooms({String? kind, String? status}) async {
    final res = await _dio.get('$_root/rooms', queryParameters: {
      if (kind != null) 'kind': kind,
      if (status != null) 'status': status,
    });
    return (res.data['items'] as List?) ?? const [];
  }
  Future<List<dynamic>> myRooms() async =>
      (((await _dio.get('$_root/rooms/mine')).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> createRoom(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/rooms', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> joinRoom(String id, {String asRole = 'attendee'}) async =>
      (await _dio.post('$_root/rooms/$id/join', data: {'asRole': asRole})).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> runSpeedRound(String id, int roundIndex) async =>
      (await _dio.post('$_root/rooms/$id/speed-round', data: {'roundIndex': roundIndex})).data as Map<String, dynamic>;
  Future<List<dynamic>> speedMatches(String id, {int? round}) async {
    final res = await _dio.get('$_root/rooms/$id/speed-matches',
        queryParameters: {if (round != null) 'round': round});
    return (res.data['items'] as List?) ?? const [];
  }

  // Cards
  Future<Map<String, dynamic>?> myCard() async =>
      (await _dio.get('$_root/cards/me')).data as Map<String, dynamic>?;
  Future<Map<String, dynamic>> upsertCard(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/cards', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> shareCard(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/cards/share', data: body)).data as Map<String, dynamic>;
  Future<List<dynamic>> receivedCards() async =>
      (((await _dio.get('$_root/cards/received')).data['items'] as List?) ?? const []);

  // Events
  Future<List<dynamic>> events({String scope = 'public', String? status}) async {
    final res = await _dio.get('$_root/events/$scope',
        queryParameters: {if (status != null) 'status': status});
    return (res.data['items'] as List?) ?? const [];
  }
  Future<Map<String, dynamic>?> event(String id) async =>
      (await _dio.get('$_root/events/$id')).data as Map<String, dynamic>?;
  Future<Map<String, dynamic>> createEvent(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/events', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> rsvp(String id, String status) async =>
      (await _dio.post('$_root/events/$id/rsvp', data: {'status': status})).data as Map<String, dynamic>;

  // Groups
  Future<List<dynamic>> groups({String? q, bool mine = false}) async {
    final res = await _dio.get('$_root/groups',
        queryParameters: {if (q != null) 'q': q, if (mine) 'mine': '1'});
    return (res.data['items'] as List?) ?? const [];
  }
  Future<Map<String, dynamic>?> group(String id) async =>
      (await _dio.get('$_root/groups/$id')).data as Map<String, dynamic>?;
  Future<Map<String, dynamic>> createGroup(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/groups', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> joinGroup(String id) async =>
      (await _dio.post('$_root/groups/$id/join', data: {})).data as Map<String, dynamic>;
  Future<List<dynamic>> groupPosts(String id) async =>
      (((await _dio.get('$_root/groups/$id/posts')).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> createGroupPost(String id, Map<String, dynamic> body) async =>
      (await _dio.post('$_root/groups/$id/posts', data: body)).data as Map<String, dynamic>;
}

final networkingEventsGroupsApiProvider = Provider<NetworkingEventsGroupsApi>((ref) {
  return NetworkingEventsGroupsApi(ref.read(apiClientProvider));
});
