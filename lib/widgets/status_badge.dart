import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;

    final s = status.toLowerCase().replaceAll(' ', '_');

    switch (s) {
      case 'active':
      case 'paid':
      case 'completed':
      case 'approved':
      case 'resolved':
      case 'present':
        bg = const Color(0xFF10B981); // Green
        break;
      case 'pending':
      case 'due':
        bg = const Color(0xFFF59E0B); // Amber / Yellow
        break;
      case 'in_progress':
      case 'opted_out':
        bg = const Color(0xFF3B82F6); // Blue
        break;
      case 'overdue':
      case 'rejected':
      case 'absent':
      case 'failed':
        bg = const Color(0xFFEF4444); // Red
        break;
      default:
        bg = const Color(0xFF64748B); // Slate Grey
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg.withAlpha(30),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: bg, width: 1),
      ),
      child: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(
          color: bg,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
