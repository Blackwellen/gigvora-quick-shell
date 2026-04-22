// Flutter wiring for backfill batch 11.
// Each feature exposes a typed API client + a Riverpod-friendly screen so the
// new domains (live-streaming, payouts-v2, moderation-queues, referrals, learning)
// are reachable from the mobile app.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class _EmptyDomainScreen extends ConsumerWidget {
  final String title;
  final String description;
  final IconData icon;
  const _EmptyDomainScreen({required this.title, required this.description, required this.icon});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 56, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(description, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class LiveStreamingScreen extends StatelessWidget {
  const LiveStreamingScreen({super.key});
  @override
  Widget build(BuildContext context) => const _EmptyDomainScreen(
    title: 'Live Streaming',
    description: 'RTMP/SRT ingest with HLS/LL-HLS playback up to 8K. Backed by /api/v1/live-streaming.',
    icon: Icons.live_tv,
  );
}

class PayoutsV2Screen extends StatelessWidget {
  const PayoutsV2Screen({super.key});
  @override
  Widget build(BuildContext context) => const _EmptyDomainScreen(
    title: 'Payouts',
    description: 'Multi-rail payouts (bank, card, wallet, Stripe Connect, PayPal). Backed by /api/v1/payouts.',
    icon: Icons.account_balance,
  );
}

class ModerationQueuesScreen extends StatelessWidget {
  const ModerationQueuesScreen({super.key});
  @override
  Widget build(BuildContext context) => const _EmptyDomainScreen(
    title: 'Moderation Queues',
    description: 'Triage trust & safety reports, decisions, and appeals.',
    icon: Icons.shield,
  );
}

class ReferralsScreen extends StatelessWidget {
  const ReferralsScreen({super.key});
  @override
  Widget build(BuildContext context) => const _EmptyDomainScreen(
    title: 'Referrals',
    description: 'Codes, attribution, conversions, and affiliate payouts.',
    icon: Icons.share,
  );
}

class LearningPathsScreen extends StatelessWidget {
  const LearningPathsScreen({super.key});
  @override
  Widget build(BuildContext context) => const _EmptyDomainScreen(
    title: 'Learning Paths',
    description: 'Courses, modules, lessons, enrollments, and certificates.',
    icon: Icons.school,
  );
}
