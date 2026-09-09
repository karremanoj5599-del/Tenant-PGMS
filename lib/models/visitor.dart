class Visitor {
  final int id;
  final String name;
  final String phone;
  final String visitDate;
  final String? purpose;
  final String status;
  final String passCode;
  final String? entryTime;
  final String? exitTime;
  final String? entryStaffName;
  final String? exitStaffName;

  Visitor({
    required this.id,
    required this.name,
    required this.phone,
    required this.visitDate,
    this.purpose,
    required this.status,
    required this.passCode,
    this.entryTime,
    this.exitTime,
    this.entryStaffName,
    this.exitStaffName,
  });

  factory Visitor.fromJson(Map<String, dynamic> json) {
    return Visitor(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      visitDate: json['visit_date']?.toString() ?? '',
      purpose: json['purpose']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      passCode: json['pass_code']?.toString() ?? '',
      entryTime: json['entry_time']?.toString(),
      exitTime: json['exit_time']?.toString(),
      entryStaffName: json['entry_staff_name']?.toString(),
      exitStaffName: json['exit_staff_name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'visit_date': visitDate,
      if (purpose != null) 'purpose': purpose,
      'status': status,
      'pass_code': passCode,
      if (entryTime != null) 'entry_time': entryTime,
      if (exitTime != null) 'exit_time': exitTime,
      if (entryStaffName != null) 'entry_staff_name': entryStaffName,
      if (exitStaffName != null) 'exit_staff_name': exitStaffName,
    };
  }
}
