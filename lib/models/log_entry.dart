class LogEntry {
  final int id;
  final String type;
  final String time;
  final String? location;
  final String? deviceName;

  LogEntry({
    required this.id,
    required this.type,
    required this.time,
    this.location,
    this.deviceName,
  });

  factory LogEntry.fromJson(Map<String, dynamic> json) {
    return LogEntry(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '') ?? 0,
      type: json['type']?.toString() ?? json['log_type']?.toString() ?? 'Entry',
      time: json['time']?.toString() ?? json['punch_time']?.toString() ?? '',
      location: json['location']?.toString() ?? 'Main Gate',
      deviceName: json['device_name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'time': time,
      if (location != null) 'location': location,
      if (deviceName != null) 'device_name': deviceName,
    };
  }
}
