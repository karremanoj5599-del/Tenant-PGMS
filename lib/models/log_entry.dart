class LogEntry {
  final int id;
  final String type;
  final String time;
  final String? location;
  final String? deviceName;
  final String? deviceSn;
  final String? verifyType;

  LogEntry({
    required this.id,
    required this.type,
    required this.time,
    this.location,
    this.deviceName,
    this.deviceSn,
    this.verifyType,
  });

  factory LogEntry.fromJson(Map<String, dynamic> json) {
    return LogEntry(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? json['log_id']?.toString() ?? '') ?? 0,
      type: json['type']?.toString() ?? json['log_type']?.toString() ?? ((json['status'] == 1) ? 'Exit' : 'Entry'),
      time: json['time']?.toString() ?? json['punch_time']?.toString() ?? '',
      location: json['location']?.toString() ?? json['device_name']?.toString() ?? 'Main Gate Turnstile',
      deviceName: json['device_name']?.toString(),
      deviceSn: json['device_sn']?.toString(),
      verifyType: json['verify_type']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'time': time,
      if (location != null) 'location': location,
      if (deviceName != null) 'device_name': deviceName,
      if (deviceSn != null) 'device_sn': deviceSn,
      if (verifyType != null) 'verify_type': verifyType,
    };
  }
}

class DayLogReport {
  final String date;
  final int totalPunches;
  final String firstIn;
  final String lastOut;
  final int durationMinutes;
  final String durationFormatted;
  final List<LogEntry> punches;

  DayLogReport({
    required this.date,
    required this.totalPunches,
    required this.firstIn,
    required this.lastOut,
    required this.durationMinutes,
    required this.durationFormatted,
    required this.punches,
  });

  factory DayLogReport.fromJson(Map<String, dynamic> json) {
    final list = (json['punches'] as List?) ?? [];
    return DayLogReport(
      date: json['date']?.toString() ?? '',
      totalPunches: json['total_punches'] is int ? json['total_punches'] : int.tryParse(json['total_punches']?.toString() ?? '') ?? list.length,
      firstIn: json['first_in']?.toString() ?? '',
      lastOut: json['last_out']?.toString() ?? '',
      durationMinutes: json['duration_minutes'] is int ? json['duration_minutes'] : int.tryParse(json['duration_minutes']?.toString() ?? '') ?? 0,
      durationFormatted: json['duration_formatted']?.toString() ?? 'Single punch',
      punches: list.whereType<Map<String, dynamic>>().map((p) => LogEntry.fromJson(p)).toList(),
    );
  }
}
