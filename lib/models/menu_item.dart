class MenuItem {
  final String id;
  final String day;
  final String? date;
  final String breakfast;
  final String lunch;
  final String dinner;
  final bool optedOut;

  MenuItem({
    required this.id,
    required this.day,
    this.date,
    required this.breakfast,
    required this.lunch,
    required this.dinner,
    this.optedOut = false,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id']?.toString() ?? '',
      day: json['day']?.toString() ?? '',
      date: json['date']?.toString(),
      breakfast: json['breakfast']?.toString() ?? '',
      lunch: json['lunch']?.toString() ?? '',
      dinner: json['dinner']?.toString() ?? '',
      optedOut: json['optedOut'] == true || json['opted_out'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'day': day,
      if (date != null) 'date': date,
      'breakfast': breakfast,
      'lunch': lunch,
      'dinner': dinner,
      'optedOut': optedOut,
    };
  }

  MenuItem copyWith({
    String? id,
    String? day,
    String? date,
    String? breakfast,
    String? lunch,
    String? dinner,
    bool? optedOut,
  }) {
    return MenuItem(
      id: id ?? this.id,
      day: day ?? this.day,
      date: date ?? this.date,
      breakfast: breakfast ?? this.breakfast,
      lunch: lunch ?? this.lunch,
      dinner: dinner ?? this.dinner,
      optedOut: optedOut ?? this.optedOut,
    );
  }
}
