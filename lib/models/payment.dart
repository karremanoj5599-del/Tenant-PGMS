class Payment {
  final int id;
  final double amount;
  final String? month;
  final int? year;
  final String? paymentMethod;
  final String? transactionId;
  final String createdAt;
  final String? status;

  Payment({
    required this.id,
    required this.amount,
    this.month,
    this.year,
    this.paymentMethod,
    this.transactionId,
    required this.createdAt,
    this.status,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      amount: (json['amount'] != null ? double.tryParse(json['amount'].toString()) : null) ?? 0.0,
      month: json['month']?.toString(),
      year: json['year'] != null ? int.tryParse(json['year'].toString()) : null,
      paymentMethod: json['payment_method']?.toString(),
      transactionId: json['transaction_id']?.toString(),
      createdAt: json['created_at']?.toString() ?? DateTime.now().toIso8601String(),
      status: json['status']?.toString() ?? 'completed',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'amount': amount,
      if (month != null) 'month': month,
      if (year != null) 'year': year,
      if (paymentMethod != null) 'payment_method': paymentMethod,
      if (transactionId != null) 'transaction_id': transactionId,
      'created_at': createdAt,
      if (status != null) 'status': status,
    };
  }
}
