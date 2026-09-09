class Billing {
  final String month;
  final int year;
  final double fixedRent;
  final double previousBalance;
  final double totalDue;
  final double amountPaid;
  final double currentBalance;
  final String? dueDate;
  final String? status;

  Billing({
    required this.month,
    required this.year,
    required this.fixedRent,
    required this.previousBalance,
    required this.totalDue,
    required this.amountPaid,
    required this.currentBalance,
    this.dueDate,
    this.status,
  });

  factory Billing.fromJson(Map<String, dynamic> json) {
    return Billing(
      month: json['month']?.toString() ?? '',
      year: json['year'] is int ? json['year'] : int.tryParse(json['year']?.toString() ?? '') ?? DateTime.now().year,
      fixedRent: (json['fixed_rent'] != null ? double.tryParse(json['fixed_rent'].toString()) : null) ?? 0.0,
      previousBalance: (json['previous_balance'] != null ? double.tryParse(json['previous_balance'].toString()) : null) ?? 0.0,
      totalDue: (json['total_due'] != null ? double.tryParse(json['total_due'].toString()) : null) ?? 0.0,
      amountPaid: (json['amount_paid'] != null ? double.tryParse(json['amount_paid'].toString()) : null) ?? 0.0,
      currentBalance: (json['current_balance'] != null ? double.tryParse(json['current_balance'].toString()) : null) ?? 0.0,
      dueDate: json['due_date']?.toString(),
      status: json['status']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'year': year,
      'fixed_rent': fixedRent,
      'previous_balance': previousBalance,
      'total_due': totalDue,
      'amount_paid': amountPaid,
      'current_balance': currentBalance,
      if (dueDate != null) 'due_date': dueDate,
      if (status != null) 'status': status,
    };
  }
}
