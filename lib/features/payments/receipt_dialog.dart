import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/payment.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/status_badge.dart';

class ReceiptDialog extends StatelessWidget {
  final Payment payment;

  const ReceiptDialog({super.key, required this.payment});

  static void show(BuildContext context, Payment payment) {
    showDialog(
      context: context,
      builder: (_) => ReceiptDialog(payment: payment),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);
    final auth = Provider.of<AuthProvider>(context);
    final tenant = auth.tenant;

    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    String formattedDate = payment.createdAt;
    try {
      final dt = DateTime.parse(payment.createdAt);
      formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(dt);
    } catch (_) {}

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(20),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: colors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.cardBorder),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Success icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: colors.success.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.check_circle, color: colors.success, size: 36),
            ),
            const SizedBox(height: 12),
            Text(
              'Payment Receipt',
              style: TextStyle(
                fontSize: 20 * theme.uiScale,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            Text(
              'Property Management System',
              style: TextStyle(
                fontSize: 12 * theme.uiScale,
                color: colors.textMuted,
              ),
            ),
            const SizedBox(height: 20),

            // Amount Display
            Text(
              currencyFmt.format(payment.amount),
              style: TextStyle(
                fontSize: 32 * theme.uiScale,
                fontWeight: FontWeight.w800,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 8),
            StatusBadge(status: payment.status ?? 'Completed'),
            const SizedBox(height: 20),
            Divider(color: colors.separator),
            const SizedBox(height: 16),

            // Details
            _ReceiptRow(label: 'Tenant', value: tenant?.name ?? 'Tenant'),
            _ReceiptRow(label: 'Room / Bed', value: '${tenant?.room ?? ''} - ${tenant?.bed ?? ''}'),
            if (payment.month != null)
              _ReceiptRow(label: 'Rent Period', value: '${payment.month} ${payment.year ?? ''}'),
            _ReceiptRow(label: 'Payment Method', value: payment.paymentMethod ?? 'Online'),
            if (payment.transactionId != null)
              _ReceiptRow(label: 'Transaction ID', value: payment.transactionId!),
            _ReceiptRow(label: 'Date & Time', value: formattedDate),

            const SizedBox(height: 24),
            AppButton(
              text: 'Close Receipt',
              width: double.infinity,
              variant: AppButtonVariant.secondary,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;

  const _ReceiptRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 13 * theme.uiScale, color: colors.textMuted),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 13 * theme.uiScale,
                fontWeight: FontWeight.w600,
                color: colors.text,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
