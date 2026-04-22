import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/router.dart';

void main() {
  runApp(const ProviderScope(child: GigvoraApp()));
}

class GigvoraApp extends ConsumerWidget {
  const GigvoraApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Gigvora',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF1E40AF), // enterprise navy
      ),
      routerConfig: router,
    );
  }
}
