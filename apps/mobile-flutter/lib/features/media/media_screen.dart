import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'media_api.dart';

/// Mobile parity for Domain 20 (Media Viewer).
/// Layout: tabbed gallery (All / Images / Videos / Docs).
/// Touch affordances: tap → bottom-sheet preview with metadata + signed-URL download CTA;
/// long-press → archive/retry sheet; swipe-down dismiss.
class MediaScreen extends ConsumerStatefulWidget {
  const MediaScreen({super.key});
  @override
  ConsumerState<MediaScreen> createState() => _MediaScreenState();
}

class _MediaScreenState extends ConsumerState<MediaScreen> {
  String _kind = 'all';

  @override
  Widget build(BuildContext context) {
    final api = ref.watch(mediaApiProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Media')),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: ['all', 'image', 'video', 'document', 'audio'].map((k) {
                final on = k == _kind;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(label: Text(k), selected: on, onSelected: (_) => setState(() => _kind = k)),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<MediaAsset>>(
              future: api.list(kind: _kind == 'all' ? null : _kind),
              builder: (ctx, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
                final items = snap.data ?? const [];
                if (items.isEmpty) return const Center(child: Text('No media yet.'));
                return GridView.builder(
                  padding: const EdgeInsets.all(8),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 0.85,
                  ),
                  itemCount: items.length,
                  itemBuilder: (_, i) {
                    final a = items[i];
                    return GestureDetector(
                      onTap: () => _preview(context, a, api),
                      onLongPress: () => _moreActions(context, a, api),
                      child: Card(
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(child: Container(color: Colors.black12, child: Center(child: Icon(_iconFor(a.kind), size: 36)))),
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(a.title ?? a.filename, maxLines: 1, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w600)),
                                Text('${a.kind} · ${(a.sizeBytes / 1_000_000).toStringAsFixed(1)} MB',
                                    style: const TextStyle(fontSize: 11, color: Colors.black54)),
                                Text('${a.views} views · ${a.likes} likes',
                                    style: const TextStyle(fontSize: 11, color: Colors.black45)),
                              ]),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconFor(String kind) {
    switch (kind) {
      case 'image': return Icons.image_outlined;
      case 'video': return Icons.videocam_outlined;
      case 'audio': return Icons.audiotrack_outlined;
      case 'document': return Icons.description_outlined;
      default: return Icons.insert_drive_file_outlined;
    }
  }

  void _preview(BuildContext ctx, MediaAsset a, MediaApi api) {
    api.view(a.id);
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        expand: false, initialChildSize: 0.7, minChildSize: 0.3, maxChildSize: 0.95,
        builder: (_, sc) => SingleChildScrollView(
          controller: sc,
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(a.title ?? a.filename, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('${a.kind} · ${a.mimeType} · ${(a.sizeBytes / 1_000_000).toStringAsFixed(2)} MB',
                style: const TextStyle(color: Colors.black54)),
            const SizedBox(height: 12),
            Container(height: 220, color: Colors.black12, alignment: Alignment.center,
                child: Icon(_iconFor(a.kind), size: 64)),
            const SizedBox(height: 12),
            if (a.description != null) Text(a.description!),
            const SizedBox(height: 12),
            Wrap(spacing: 6, children: a.tags.map((t) => Chip(label: Text(t))).toList()),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.download),
                  label: const Text('Download'),
                  onPressed: () async {
                    try {
                      final r = await api.signDownload(a.id);
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text('Signed URL ready (${r['expiresAt']})')),
                        );
                      }
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Failed: $e')));
                      }
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.favorite_outline),
                onPressed: () => api.like(a.id),
              ),
            ]),
          ]),
        ),
      ),
    );
  }

  void _moreActions(BuildContext ctx, MediaAsset a, MediaApi api) {
    showModalBottomSheet(
      context: ctx,
      builder: (_) => SafeArea(
        child: Wrap(children: [
          if (a.status == 'failed' || a.status == 'processing')
            ListTile(
              leading: const Icon(Icons.refresh),
              title: const Text('Retry processing'),
              onTap: () async { await api.retry(a.id); if (ctx.mounted) Navigator.pop(ctx); },
            ),
          ListTile(
            leading: const Icon(Icons.archive_outlined),
            title: const Text('Archive'),
            onTap: () async { await api.archive(a.id); if (ctx.mounted) Navigator.pop(ctx); },
          ),
          ListTile(
            leading: const Icon(Icons.close),
            title: const Text('Cancel'),
            onTap: () => Navigator.pop(ctx),
          ),
        ]),
      ),
    );
  }
}
