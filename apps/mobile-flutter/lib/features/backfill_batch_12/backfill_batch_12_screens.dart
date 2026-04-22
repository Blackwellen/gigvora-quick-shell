// Flutter wiring for backfill batch 12 — Notifications v2 + Calendar v2.
// Each domain exposes a screen that targets the corresponding NestJS module.
import 'package:flutter/material.dart';

class _DomainScreen extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  const _DomainScreen({required this.title, required this.description, required this.icon});

  @override
  Widget build(BuildContext context) {
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

class NotificationsV2Screen extends StatelessWidget {
  const NotificationsV2Screen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Notifications',
    description: 'Push, email, SMS, in-app, and webhook delivery with quiet hours and per-category preferences. Backed by /api/v1/notifications.',
    icon: Icons.notifications_active,
  );
}

class CalendarV2Screen extends StatelessWidget {
  const CalendarV2Screen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Calendar',
    description: 'Calendars, events, RSVPs, recurrence (RRULE), and shareable scheduling links. Backed by /api/v1/calendar.',
    icon: Icons.calendar_today,
  );
}

class SchedulingLinksScreen extends StatelessWidget {
  const SchedulingLinksScreen({super.key});
  @override
  Widget build(BuildContext context) => const _DomainScreen(
    title: 'Scheduling Links',
    description: 'Public booking pages with availability windows and buffers.',
    icon: Icons.link,
  );
}
