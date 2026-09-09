class TenantInfo {
  final int id;
  final String name;
  final String mobile;
  final String? email;
  final String? room;
  final String? bed;
  final String? sharing;
  final int? userId;
  final String? advanceVacateDate;
  final double? rent;
  final String? dueDate;
  final double? deposit;
  final String? status;

  TenantInfo({
    required this.id,
    required this.name,
    required this.mobile,
    this.email,
    this.room,
    this.bed,
    this.sharing,
    this.userId,
    this.advanceVacateDate,
    this.rent,
    this.dueDate,
    this.deposit,
    this.status,
  });

  factory TenantInfo.fromJson(Map<String, dynamic> json) {
    return TenantInfo(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name']?.toString() ?? '',
      mobile: json['mobile']?.toString() ?? '',
      email: json['email']?.toString(),
      room: json['room']?.toString() ?? json['room_number']?.toString(),
      bed: json['bed']?.toString() ?? json['bed_number']?.toString(),
      sharing: json['sharing']?.toString(),
      userId: json['user_id'] != null ? int.tryParse(json['user_id'].toString()) : null,
      advanceVacateDate: json['advance_vacate_date']?.toString(),
      rent: json['rent'] != null ? double.tryParse(json['rent'].toString()) : null,
      dueDate: json['due_date']?.toString(),
      deposit: json['deposit'] != null ? double.tryParse(json['deposit'].toString()) : null,
      status: json['status']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'mobile': mobile,
      if (email != null) 'email': email,
      if (room != null) 'room': room,
      if (bed != null) 'bed': bed,
      if (sharing != null) 'sharing': sharing,
      if (userId != null) 'user_id': userId,
      if (advanceVacateDate != null) 'advance_vacate_date': advanceVacateDate,
      if (rent != null) 'rent': rent,
      if (dueDate != null) 'due_date': dueDate,
      if (deposit != null) 'deposit': deposit,
      if (status != null) 'status': status,
    };
  }

  TenantInfo copyWith({
    int? id,
    String? name,
    String? mobile,
    String? email,
    String? room,
    String? bed,
    String? sharing,
    int? userId,
    String? advanceVacateDate,
    double? rent,
    String? dueDate,
    double? deposit,
    String? status,
  }) {
    return TenantInfo(
      id: id ?? this.id,
      name: name ?? this.name,
      mobile: mobile ?? this.mobile,
      email: email ?? this.email,
      room: room ?? this.room,
      bed: bed ?? this.bed,
      sharing: sharing ?? this.sharing,
      userId: userId ?? this.userId,
      advanceVacateDate: advanceVacateDate ?? this.advanceVacateDate,
      rent: rent ?? this.rent,
      dueDate: dueDate ?? this.dueDate,
      deposit: deposit ?? this.deposit,
      status: status ?? this.status,
    );
  }
}
