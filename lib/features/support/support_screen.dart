import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/ticket.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/star_rating.dart';
import '../../widgets/status_badge.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final ApiService _apiService = ApiService();
  List<Ticket> _tickets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  Future<void> _fetchTickets() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    final list = await _apiService.getTickets();
    if (mounted) {
      setState(() {
        _tickets = list;
        _loading = false;
      });
    }
  }

  void _showCreateTicketModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateTicketModal(onTicketCreated: _fetchTickets),
    );
  }

  void _showRateModal(Ticket ticket) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RateTicketModal(ticket: ticket, onRated: _fetchTickets),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Support & Tickets')),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchTickets,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  AppButton(
                    text: '+ Raise New Ticket',
                    icon: Icons.add_circle_outline,
                    width: double.infinity,
                    onPressed: _showCreateTicketModal,
                  ),
                  const SizedBox(height: 20),

                  Text(
                    'Your Support Tickets',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_tickets.isEmpty)
                    AppCard(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Text(
                            'No open tickets. If you need assistance with plumbing, wifi, or cleaning, raise a ticket.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: colors.textMuted),
                          ),
                        ),
                      ),
                    )
                  else
                    ..._tickets.map((t) {
                      String dateStr = t.createdAt;
                      try {
                        final dt = DateTime.parse(t.createdAt);
                        dateStr = DateFormat('dd MMM yyyy').format(dt);
                      } catch (_) {}

                      return AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  t.category.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 14 * theme.uiScale,
                                    fontWeight: FontWeight.bold,
                                    color: colors.accent,
                                  ),
                                ),
                                StatusBadge(status: t.status),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              t.description,
                              style: TextStyle(
                                fontSize: 14 * theme.uiScale,
                                color: colors.text,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Raised: $dateStr',
                              style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                            ),

                            // If resolved, show rating or Rate button
                            if (t.status.toLowerCase() == 'resolved') ...[
                              const SizedBox(height: 12),
                              Divider(color: colors.separator),
                              const SizedBox(height: 6),
                              if (t.rating != null && t.rating! > 0)
                                Row(
                                  children: [
                                    StarRating(rating: t.rating!, size: 18),
                                    const SizedBox(width: 8),
                                    Text(
                                      t.feedback ?? 'Rated',
                                      style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textSecondary),
                                    ),
                                  ],
                                )
                              else
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton.icon(
                                    icon: const Icon(Icons.star_outline, size: 16),
                                    label: const Text('Rate Service'),
                                    onPressed: () => _showRateModal(t),
                                  ),
                                ),
                            ],
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

class _CreateTicketModal extends StatefulWidget {
  final VoidCallback onTicketCreated;

  const _CreateTicketModal({required this.onTicketCreated});

  @override
  State<_CreateTicketModal> createState() => _CreateTicketModalState();
}

class _CreateTicketModalState extends State<_CreateTicketModal> {
  final _descriptionController = TextEditingController();
  final ApiService _apiService = ApiService();
  String _selectedCategory = 'Plumbing';
  bool _submitting = false;

  final categories = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Cleaning',
    'Wi-Fi & Internet',
    'General',
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final desc = _descriptionController.text.trim();
    if (desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please describe your issue.')),
      );
      return;
    }

    setState(() => _submitting = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final success = await _apiService.createTicket(_selectedCategory, desc);

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        Navigator.of(context).pop();
        widget.onTicketCreated();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Support ticket raised successfully!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit ticket.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Raise Support Ticket',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20 * theme.uiScale,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 20),

            Text(
              'Category',
              style: TextStyle(fontSize: 14 * theme.uiScale, fontWeight: FontWeight.w600, color: colors.textSecondary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return ChoiceChip(
                  label: Text(cat),
                  selected: isSelected,
                  selectedColor: colors.accent.withAlpha(40),
                  labelStyle: TextStyle(
                    color: isSelected ? colors.accent : colors.text,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (val) {
                    if (val) setState(() => _selectedCategory = cat);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            AppTextField(
              label: 'Issue Description',
              placeholder: 'Describe the problem clearly...',
              controller: _descriptionController,
              maxLines: 4,
            ),
            const SizedBox(height: 24),

            AppButton(
              text: 'Submit Ticket',
              isLoading: _submitting,
              onPressed: _handleSubmit,
            ),
          ],
        ),
      ),
    );
  }
}

class _RateTicketModal extends StatefulWidget {
  final Ticket ticket;
  final VoidCallback onRated;

  const _RateTicketModal({required this.ticket, required this.onRated});

  @override
  State<_RateTicketModal> createState() => _RateTicketModalState();
}

class _RateTicketModalState extends State<_RateTicketModal> {
  final _feedbackController = TextEditingController();
  final ApiService _apiService = ApiService();
  int _rating = 5;
  bool _submitting = false;

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  Future<void> _handleRate() async {
    setState(() => _submitting = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final success = await _apiService.rateTicket(
      widget.ticket.id,
      _rating,
      _feedbackController.text.trim(),
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        Navigator.of(context).pop();
        widget.onRated();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thank you for your rating!')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Rate Service Quality',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20 * theme.uiScale,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'How satisfied are you with the resolution of Ticket #${widget.ticket.id}?',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13 * theme.uiScale, color: colors.textSecondary),
            ),
            const SizedBox(height: 20),

            Center(
              child: StarRating(
                rating: _rating,
                size: 36,
                onRatingChanged: (r) => setState(() => _rating = r),
              ),
            ),
            const SizedBox(height: 20),

            AppTextField(
              label: 'Feedback (Optional)',
              placeholder: 'Any comments about the staff work...',
              controller: _feedbackController,
              maxLines: 2,
            ),
            const SizedBox(height: 24),

            AppButton(
              text: 'Submit Rating',
              isLoading: _submitting,
              onPressed: _handleRate,
            ),
          ],
        ),
      ),
    );
  }
}
