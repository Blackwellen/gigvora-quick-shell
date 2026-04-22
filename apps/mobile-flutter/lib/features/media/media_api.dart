import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class MediaAsset {
  final String id, ownerId, kind, status, filename, mimeType;
  final String? title, description, thumbnailUrl;
  final int sizeBytes, views, downloads, likes;
  final List<String> tags;
  MediaAsset({
    required this.id, required this.ownerId, required this.kind, required this.status,
    required this.filename, required this.mimeType, required this.sizeBytes,
    required this.views, required this.downloads, required this.likes,
    required this.tags, this.title, this.description, this.thumbnailUrl,
  });
  factory MediaAsset.fromJson(Map<String, dynamic> j) => MediaAsset(
    id: j['id'], ownerId: j['ownerId'] ?? '', kind: j['kind'] ?? 'other',
    status: j['status'] ?? 'active', filename: j['filename'] ?? '',
    mimeType: j['mimeType'] ?? '', sizeBytes: j['sizeBytes'] ?? 0,
    views: j['views'] ?? 0, downloads: j['downloads'] ?? 0, likes: j['likes'] ?? 0,
    tags: List<String>.from(j['tags'] ?? const []),
    title: j['title'], description: j['description'], thumbnailUrl: j['thumbnailUrl'],
  );
}

class MediaApi {
  final Dio _dio;
  MediaApi(this._dio);

  Future<List<MediaAsset>> list({String? kind, String? status, String? q}) async {
    final r = await _dio.get('/api/v1/media/assets', queryParameters: {
      if (kind != null) 'kind': kind,
      if (status != null) 'status': status,
      if (q != null) 'q': q,
    });
    final items = (r.data['items'] ?? const []) as List;
    return items.map((e) => MediaAsset.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<MediaAsset> detail(String id) async {
    final r = await _dio.get('/api/v1/media/assets/$id');
    return MediaAsset.fromJson(r.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> signDownload(String id) async {
    final r = await _dio.get('/api/v1/media/sign/download/$id');
    return r.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> signUpload(Map<String, dynamic> body) async {
    final r = await _dio.post('/api/v1/media/sign/upload', data: body);
    return r.data as Map<String, dynamic>;
  }

  Future<MediaAsset> archive(String id) async {
    final r = await _dio.post('/api/v1/media/assets/$id/archive');
    return MediaAsset.fromJson(r.data as Map<String, dynamic>);
  }

  Future<MediaAsset> retry(String id) async {
    final r = await _dio.post('/api/v1/media/assets/$id/retry');
    return MediaAsset.fromJson(r.data as Map<String, dynamic>);
  }

  Future<void> like(String id) async => _dio.post('/api/v1/media/assets/$id/like');
  Future<void> view(String id) async => _dio.post('/api/v1/media/assets/$id/view');

  Future<Map<String, dynamic>> insights() async {
    final r = await _dio.get('/api/v1/media/insights');
    return r.data as Map<String, dynamic>;
  }
}

final mediaApiProvider = Provider<MediaApi>((ref) => MediaApi(ref.watch(apiClientProvider)));
