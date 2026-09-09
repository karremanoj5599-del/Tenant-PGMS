class Ticket {
  final int id;
  final int? tenantId;
  final String category;
  final String description;
  final String status;
  final String createdAt;
  final String? adminNotes;
  final int? rating;
  final String? feedback;

  Ticket({
    required this.id,
    this.tenantId,
    required this.category,
    required this.description,
    required this.status,
    required this.createdAt,
    this.adminNotes,
    this.rating,
    this.feedback,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      tenantId: json['tenant_id'] != null ? int.tryParse(json['tenant_id'].toString()) : null,
      category: json['category']?.toString() ?? json['issue_category']?.toString() ?? 'General',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      createdAt: json['created_at']?.toString() ?? DateTime.now().toIso8601String(),
      adminNotes: json['admin_notes']?.toString(),
      rating: json['rating'] != null ? int.tryParse(json['rating'].toString()) : null,
      feedback: json['feedback']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      'category': category,
      'description': description,
      'status': status,
      'created_at': createdAt,
      if (adminNotes != null) 'admin_notes': adminNotes,
      if (rating != null) 'rating': rating,
      if (feedback != null) 'feedback': feedback,
    };
  }

  Ticket copyWith({
    int? id,
    int? tenantId,
    String? category,
    String? description,
    String? status,
    String? createdAt,
    String? adminNotes,
    int? rating,
    String? feedback,
  }) {
    return Ticket(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      category: category ?? this.category,
      description: description ?? this.description,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      adminNotes: adminNotes ?? this.adminNotes,
      rating: rating ?? this.rating,
      feedback: feedback ?? this.feedback,
    );
  }
}
