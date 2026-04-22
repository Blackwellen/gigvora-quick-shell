import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class PodcastsApi {
  final Dio _dio;
  PodcastsApi(this._dio);

  Future<List<dynamic>> discover({String? q, String? category}) async {
    final r = await _dio.get('/api/v1/podcasts/discover',
        queryParameters: {if (q != null) 'q': q, if (category != null) 'category': category});
    return (r.data['items'] as List?) ?? const [];
  }

  Future<List<dynamic>> shows({bool mine = false}) async {
    final r = await _dio.get('/api/v1/podcasts/shows', queryParameters: {if (mine) 'mine': '1'});
    return (r.data['items'] as List?) ?? const [];
  }

  Future<Map<String, dynamic>> show(String idOrSlug) async {
    final r = await _dio.get('/api/v1/podcasts/shows/$idOrSlug');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> episodes({String? showId}) async {
    final r = await _dio.get('/api/v1/podcasts/episodes', queryParameters: {if (showId != null) 'showId': showId});
    return (r.data['items'] as List?) ?? const [];
  }

  Future<Map<String, dynamic>> signDownload(String episodeId) async {
    final r = await _dio.get('/api/v1/podcasts/sign/download/$episodeId');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> play(String id) => _dio.post('/api/v1/podcasts/episodes/$id/play');
  Future<void> like(String id) => _dio.post('/api/v1/podcasts/episodes/$id/like');
  Future<void> subscribe(String showId) => _dio.post('/api/v1/podcasts/library/subscribe/$showId');
  Future<void> unsubscribe(String showId) => _dio.post('/api/v1/podcasts/library/unsubscribe/$showId');

  Future<List<dynamic>> queue() async {
    final r = await _dio.get('/api/v1/podcasts/queue');
    return (r.data['items'] as List?) ?? const [];
  }

  Future<void> enqueue(String episodeId) => _dio.post('/api/v1/podcasts/queue/$episodeId');

  Future<List<dynamic>> purchases() async {
    final r = await _dio.get('/api/v1/podcasts/purchases');
    return (r.data['items'] as List?) ?? const [];
  }

  Future<Map<String, dynamic>> createPurchase({
    required String kind,
    required String refId,
    required int amountCents,
    String currency = 'USD',
  }) async {
    final r = await _dio.post('/api/v1/podcasts/purchases',
        data: {'kind': kind, 'refId': refId, 'amountCents': amountCents, 'currency': currency});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> confirmPurchase(String id, {String? providerRef}) async {
    final r = await _dio.post('/api/v1/podcasts/purchases/$id/confirm',
        data: {if (providerRef != null) 'providerRef': providerRef});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> startRecording({required String title, String? showId}) async {
    final r = await _dio.post('/api/v1/podcasts/recordings/start',
        data: {'title': title, if (showId != null) 'showId': showId});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> finishRecording(String id, {required int durationSec, required String audioKey}) async {
    final r = await _dio.post('/api/v1/podcasts/recordings/$id/finish',
        data: {'durationSec': durationSec, 'audioKey': audioKey});
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final podcastsApiProvider = Provider<PodcastsApi>((ref) => PodcastsApi(ref.watch(apiClientProvider)));

final podcastDiscoverProvider = FutureProvider.autoDispose
    .family<List<dynamic>, String?>((ref, q) => ref.watch(podcastsApiProvider).discover(q: q));

final podcastShowProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) => ref.watch(podcastsApiProvider).show(id));

final podcastQueueProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) => ref.watch(podcastsApiProvider).queue());

final podcastPurchasesProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) => ref.watch(podcastsApiProvider).purchases());
