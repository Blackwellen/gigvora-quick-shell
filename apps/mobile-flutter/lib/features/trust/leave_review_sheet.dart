/// Domain 16 — Leave-review bottom sheet (mobile parity for Trust drawer).
library;

import 'package:flutter/material.dart';
import 'trust_api.dart';

class LeaveReviewSheet extends StatefulWidget {
  final TrustApi api;
  const LeaveReviewSheet({super.key, required this.api});
  @override State<LeaveReviewSheet> createState() => _LeaveReviewSheetState();
}

class _LeaveReviewSheetState extends State<LeaveReviewSheet> {
  int _rating = 5;
  final _title = TextEditingController();
  final _body = TextEditingController();
  bool _busy = false;
  String? _error;

  @override void dispose() { _title.dispose(); _body.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    try {
      await widget.api.createReview({
        'subjectKind': 'user', 'subjectId': 'me',
        'rating': _rating, 'title': _title.text.trim(), 'body': _body.text.trim(),
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() { _error = e.toString(); _busy = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + pad),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Leave a review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 12),
        Row(children: List.generate(5, (i) => IconButton(
          icon: Icon(i < _rating ? Icons.star : Icons.star_border, color: Colors.amber),
          onPressed: () => setState(() => _rating = i + 1),
        ))),
        TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 8),
        TextField(controller: _body, maxLines: 4, decoration: const InputDecoration(labelText: 'Body')),
        if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: Colors.red))),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _busy || _title.text.trim().length < 2 || _body.text.trim().length < 10 ? null : _submit,
          child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Submit review'),
        ),
      ]),
    );
  }
}
