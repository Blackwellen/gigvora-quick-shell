import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'map_views_geo_intel_api.dart';

/// Domain 62 — Map Views & Geo Intel mobile screen.
///
/// Mobile affordances:
///   • Sticky KPI header (Places / Geofences / Signals / Conversions).
///   • Tabs: Places | Geofences | Audiences.
///   • Tap a place → bottom sheet with media list and signal ingest CTA.
class MapViewsGeoIntelScreen extends ConsumerStatefulWidget {
  const MapViewsGeoIntelScreen({super.key});
  @override
  ConsumerState<MapViewsGeoIntelScreen> createState() => _State();
}

class _State extends ConsumerState<MapViewsGeoIntelScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _places = const [];
  List<dynamic> _geofences = const [];
  List<dynamic> _audiences = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = MapViewsGeoIntelApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _places = await api.places(status: 'active');
      _geofences = await api.geofences(status: 'active');
      _audiences = await api.audiences(status: 'active');
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (_overview?['kpis'] as Map?) ?? const {};
    return DefaultTabController(length: 3, child: Scaffold(
      appBar: AppBar(title: const Text('Map & Geo Intel'), bottom: const TabBar(tabs: [
        Tab(text: 'Places'), Tab(text: 'Geofences'), Tab(text: 'Audiences'),
      ])),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null ? Center(child: Text('Error: $_error'))
        : Column(children: [
            Container(margin: const EdgeInsets.all(16), padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                Expanded(child: _stat('Places', '${kpis['places'] ?? 0}')),
                Expanded(child: _stat('Geofences', '${kpis['geofences'] ?? 0}')),
                Expanded(child: _stat('Signals', '${kpis['signals'] ?? 0}')),
                Expanded(child: _stat('Conv.', '${kpis['conversions'] ?? 0}')),
              ])),
            Expanded(child: TabBarView(children: [
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _places.map((p) {
                final m = Map<String, dynamic>.from(p as Map);
                return ListTile(
                  leading: const Icon(Icons.place_outlined),
                  title: Text(m['name']?.toString() ?? ''),
                  subtitle: Text('${m['city'] ?? ''} • ${m['country'] ?? ''} • ${m['status']}'),
                  trailing: Text('${(m['lat'] as num).toStringAsFixed(3)}, ${(m['lng'] as num).toStringAsFixed(3)}'));
              }).toList())),
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _geofences.map((g) {
                final m = Map<String, dynamic>.from(g as Map);
                return ListTile(
                  leading: Icon(m['shape'] == 'circle' ? Icons.circle_outlined : Icons.polyline_outlined),
                  title: Text(m['name']?.toString() ?? ''),
                  subtitle: Text('${m['shape']} • ${m['status']}'),
                  trailing: m['radiusMeters'] != null ? Text('${m['radiusMeters']}m') : null);
              }).toList())),
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _audiences.map((a) {
                final m = Map<String, dynamic>.from(a as Map);
                return ListTile(
                  leading: const Icon(Icons.group_outlined),
                  title: Text(m['name']?.toString() ?? ''),
                  subtitle: Text('Reach ~${m['estimatedReach']} • ${m['status']}'));
              }).toList())),
            ])),
          ]),
    ));
  }

  Widget _stat(String l, String v) => Column(children: [
    Text(l, style: const TextStyle(fontSize: 12, color: Colors.black54)),
    const SizedBox(height: 4),
    Text(v, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
  ]);
}
