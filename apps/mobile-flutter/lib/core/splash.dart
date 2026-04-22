import 'package:flutter/material.dart';

/// Splash screen shown while FirebaseBootstrap.init() and auth restore run.
/// Branded Gigvora navy background with the wordmark.
class GigvoraSplash extends StatelessWidget {
  const GigvoraSplash({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text(
              'Gigvora',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 24),
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(Color(0xFF60A5FA)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
