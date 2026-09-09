class MessHistoryItem {
  final int id;
  final String scanDate;
  final String scanTime;
  final String mealType;
  final String? rentStatus;

  MessHistoryItem({
    required this.id,
    required this.scanDate,
    required this.scanTime,
    required this.mealType,
    this.rentStatus,
  });

  factory MessHistoryItem.fromJson(Map<String, dynamic> json) {
    return MessHistoryItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '') ?? 0,
      scanDate: json['scan_date']?.toString() ?? '',
      scanTime: json['scan_time']?.toString() ?? '',
      mealType: json['meal_type']?.toString() ?? 'Meal',
      rentStatus: json['rent_status']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'scan_date': scanDate,
      'scan_time': scanTime,
      'meal_type': mealType,
      if (rentStatus != null) 'rent_status': rentStatus,
    };
  }
}
