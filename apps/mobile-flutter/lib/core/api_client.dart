import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'storage.dart';

const _apiBase = String.fromEnvironment(
  'GIGVORA_API_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

final apiClientProvider = Provider<Dio>((ref) {
  final storage = ref.watch(storageProvider);
  final dio = Dio(BaseOptions(
    baseUrl: _apiBase,
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 12),
    contentType: 'application/json',
  ));
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await storage.getToken();
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
      handler.next(options);
    },
  ));
  return dio;
});
