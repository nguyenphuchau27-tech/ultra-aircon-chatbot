class ApiConfig {
  ApiConfig._();

  // Android Emulator -> host machine backend.
  // Backend required by Phase 5.5: http://localhost:3002/api on host.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3002/api',
  );
}
