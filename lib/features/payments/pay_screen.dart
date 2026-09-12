import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/billing.dart';
import '../../models/payment.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/status_badge.dart';
import 'receipt_dialog.dart';

class PayScreen extends StatefulWidget {
  const PayScreen({super.key});

  @override
  State<PayScreen> createState() => _PayScreenState();
}

class _PayScreenState extends State<PayScreen> {
  final ApiService _apiService = ApiService();
  Billing? _billing;
  List<Payment> _payments = [];
  bool _loading = true;
  bool _paying = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final b = await _apiService.getBilling();
    final p = await _apiService.getPaymentHistory();

    if (mounted) {
      setState(() {
        _billing = b;
        _payments = p;
        _loading = false;
      });
    }
  }

  Future<void> _handlePayment() async {
    if (_billing == null) return;
    setState(() => _paying = true);

    final amountToPay = _billing!.currentBalance > 0 ? _billing!.currentBalance : _billing!.totalDue;
    final now = DateTime.now();
    final txnId = 'UPI${now.millisecondsSinceEpoch.toString().substring(5)}';

    final result = await _apiService.recordPayment(
      amount: amountToPay,
      month: _billing!.month,
      year: _billing!.year,
      paymentMethod: 'UPI',
      transactionId: txnId,
    );

    if (mounted) {
      setState(() => _paying = false);

      if (result.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.data ?? 'Payment recorded successfully!')),
        );
        _fetchData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.error ?? 'Payment failed.')),
        );
      }
    }
  }

  Future<void> _downloadReceipt(int paymentId) async {
    final url = _apiService.getReceiptUrl(paymentId);
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open browser to download receipt.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Payments & Billing')),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Billing Summary Card
                  if (_billing != null) ...[
                    AppCard(
                      backgroundColor: colors.card,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${_billing!.month} ${_billing!.year}',
                                style: TextStyle(
                                  fontSize: 18 * theme.uiScale,
                                  fontWeight: FontWeight.bold,
                                  color: colors.text,
                                ),
                              ),
                              StatusBadge(
                                status: _billing!.currentBalance <= 0 ? 'Paid' : 'Due',
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _billing!.currentBalance <= 0 ? 'Balance Clear' : 'Current Due Amount',
                            style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            currencyFmt.format(_billing!.currentBalance <= 0 ? 0 : _billing!.currentBalance),
                            style: TextStyle(
                              fontSize: 32 * theme.uiScale,
                              fontWeight: FontWeight.w800,
                              color: _billing!.currentBalance <= 0 ? colors.success : colors.danger,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Divider(color: colors.separator),
                          const SizedBox(height: 12),

                          _BillLine(label: 'Monthly Rent', amount: currencyFmt.format(_billing!.fixedRent)),
                          if (_billing!.previousBalance > 0)
                            _BillLine(label: 'Previous Balance', amount: currencyFmt.format(_billing!.previousBalance)),
                          _BillLine(label: 'Amount Paid', amount: currencyFmt.format(_billing!.amountPaid)),
                          if (_billing!.dueDate != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Due Date', style: TextStyle(color: colors.textMuted, fontSize: 13)),
                                  Text(_billing!.dueDate!, style: TextStyle(color: colors.text, fontWeight: FontWeight.bold, fontSize: 13)),
                                ],
                              ),
                            ),

                          if (_billing!.currentBalance > 0) ...[
                            const SizedBox(height: 20),
                            AppButton(
                              text: 'Pay ₹${_billing!.currentBalance.round()} Now (UPI)',
                              width: double.infinity,
                              isLoading: _paying,
                              icon: Icons.account_balance_wallet,
                              onPressed: _handlePayment,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),

                  // Payment History
                  Text(
                    'Payment History',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_payments.isEmpty)
                    AppCard(
                      child: Center(
                        child: Text(
                          'No payment transactions recorded yet.',
                          style: TextStyle(color: colors.textMuted),
                        ),
                      ),
                    )
                  else
                    ..._payments.map((p) {
                      String dateStr = p.createdAt;
                      try {
                        final dt = DateTime.parse(p.createdAt);
                        dateStr = DateFormat('dd MMM yyyy').format(dt);
                      } catch (_) {}

                      return AppCard(
                        onTap: () => ReceiptDialog.show(context, p),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: colors.success.withAlpha(25),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.receipt_long, color: colors.success),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    currencyFmt.format(p.amount),
                                    style: TextStyle(
                                      fontSize: 16 * theme.uiScale,
                                      fontWeight: FontWeight.bold,
                                      color: colors.text,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${p.month ?? ''} ${p.year ?? ''} · $dateStr',
                                    style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                StatusBadge(status: p.status ?? 'Completed'),
                                const SizedBox(height: 4),
                                Text(
                                  p.paymentMethod ?? 'UPI',
                                  style: TextStyle(fontSize: 11 * theme.uiScale, color: colors.textMuted),
                                ),
                              ],
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              icon: Icon(Icons.picture_as_pdf_outlined, size: 22, color: colors.accent),
                              tooltip: 'Download PDF Receipt',
                              onPressed: () => _downloadReceipt(p.id),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}

class _BillLine extends StatelessWidget {
  final String label;
  final String amount;

  const _BillLine({required this.label, required this.amount});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: colors.textSecondary, fontSize: 13 * theme.uiScale)),
          Text(amount, style: TextStyle(color: colors.text, fontWeight: FontWeight.w600, fontSize: 13 * theme.uiScale)),
        ],
      ),
    );
  }
}
