import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class SessionSnapshot {
  final String accessToken;
  final String refreshToken;
  final int? userId;
  final String? role;
  final String? sessionId;
  final String? name;
  final String? email;
  final String? phone;

  const SessionSnapshot({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.role,
    required this.sessionId,
    required this.name,
    required this.email,
    required this.phone,
  });

  bool get isCustomer => (role ?? '').toLowerCase() == 'customer';

  SessionSnapshot copyWith({
    String? accessToken,
    String? refreshToken,
    int? userId,
    String? role,
    String? sessionId,
    String? name,
    String? email,
    String? phone,
  }) {
    return SessionSnapshot(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      sessionId: sessionId ?? this.sessionId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
    );
  }
}

class ApiService {
  ApiService._internal();

  static final ApiService instance = ApiService._internal();

  final http.Client _client = http.Client();

  SharedPreferences? _prefs;
  SessionSnapshot? _session;

  static const _accessTokenKey = 'customer_access_token';
  static const _refreshTokenKey = 'customer_refresh_token';
  static const _userIdKey = 'customer_user_id';
  static const _roleKey = 'customer_role';
  static const _sessionIdKey = 'customer_session_id';
  static const _nameKey = 'customer_name';
  static const _emailKey = 'customer_email';
  static const _phoneKey = 'customer_phone';

  SessionSnapshot? get session => _session;
  bool get isLoggedIn => _session != null && _session!.isCustomer;
  int? get customerId => _session?.userId;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<bool> restoreSession() async {
    await init();
    await _loadSessionFromStorage();

    if (_session == null || !_session!.isCustomer) {
      await clearSession();
      return false;
    }

    if (_session!.refreshToken.isEmpty) {
      await clearSession();
      return false;
    }

    try {
      await refreshSession();
      return _session != null && _session!.isCustomer;
    } catch (_) {
      await clearSession();
      return false;
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _client
        .post(
          Uri.parse('${ApiConfig.baseUrl}/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email.trim(),
            'password': password,
            'appType': 'customer-app',
            'deviceType': 'android',
          }),
        )
        .timeout(const Duration(seconds: 15));

    final body = _decodeResponse(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractErrorMessage(body, fallback: 'Đăng nhập thất bại'),
        statusCode: response.statusCode,
      );
    }

    if (body is! Map<String, dynamic>) {
      throw ApiException('Backend login response không hợp lệ');
    }

    if (body['success'] == false) {
      throw ApiException(
        _extractErrorMessage(body, fallback: 'Đăng nhập thất bại'),
        statusCode: response.statusCode,
      );
    }

    final payload = _extractPayloadMap(body);

    final accessToken = _extractString(
      payload,
      keys: const ['accessToken', 'access_token'],
    );

    final refreshToken = _extractString(
      payload,
      keys: const ['refreshToken', 'refresh_token'],
    );

    if (accessToken == null || refreshToken == null) {
      throw ApiException('Backend login response thiếu token');
    }

    final jwtPayload = _decodeJwtPayload(accessToken);
    final user = payload['user'] is Map<String, dynamic>
        ? payload['user'] as Map<String, dynamic>
        : <String, dynamic>{};

    final role = (user['role'] ?? payload['role'] ?? jwtPayload['role'])
        ?.toString()
        .toLowerCase();

    if (role == null || role.isEmpty) {
      throw ApiException('Backend login response thiếu role');
    }

    if (role != 'customer') {
      throw ApiException('Tài khoản này không phải customer');
    }

    final userId = _toInt(
      user['id'] ??
          user['userId'] ??
          payload['userId'] ??
          jwtPayload['userId'] ??
          jwtPayload['sub'],
    );

    if (userId == null) {
      throw ApiException('Không xác định được customerId từ backend auth');
    }

    final sessionId = (payload['sessionId'] ??
            payload['session']?['id'] ??
            jwtPayload['sessionId'] ??
            jwtPayload['sid'])
        ?.toString();

    _session = SessionSnapshot(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      role: role,
      sessionId: sessionId,
      name: user['name']?.toString(),
      email: user['email']?.toString(),
      phone: user['phone']?.toString(),
    );

    await _persistSession();

    return {
      'success': true,
      'userId': userId,
      'role': role,
      'name': _session!.name,
      'email': _session!.email,
      'phone': _session!.phone,
    };
  }

  Future<void> logout() async {
    if (_session == null) {
      await clearSession();
      return;
    }

    try {
      await _authorizedRequest('POST', '/auth/logout');
    } catch (_) {
      // Local logout vẫn phải hoàn tất kể cả backend session đã hết hạn/revoke.
    } finally {
      await clearSession();
    }
  }

  Future<void> refreshSession() async {
    await init();

    final current = _session;
    if (current == null || current.refreshToken.isEmpty) {
      throw ApiException('Không có refresh token');
    }

    final response = await _client
        .post(
          Uri.parse('${ApiConfig.baseUrl}/auth/refresh'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': current.refreshToken}),
        )
        .timeout(const Duration(seconds: 15));

    final body = _decodeResponse(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractErrorMessage(body, fallback: 'Refresh session thất bại'),
        statusCode: response.statusCode,
      );
    }

    if (body is! Map<String, dynamic>) {
      throw ApiException('Backend refresh response không hợp lệ');
    }

    if (body['success'] == false) {
      throw ApiException(
        _extractErrorMessage(body, fallback: 'Refresh session thất bại'),
        statusCode: response.statusCode,
      );
    }

    final payload = _extractPayloadMap(body);

    final accessToken = _extractString(
      payload,
      keys: const ['accessToken', 'access_token'],
    );

    final refreshToken = _extractString(
      payload,
      keys: const ['refreshToken', 'refresh_token'],
    );

    if (accessToken == null || refreshToken == null) {
      throw ApiException('Backend refresh response thiếu token');
    }

    final jwtPayload = _decodeJwtPayload(accessToken);
    final role = (current.role ?? payload['role'] ?? jwtPayload['role'])
        ?.toString()
        .toLowerCase();

    if (role != 'customer') {
      await clearSession();
      throw ApiException('Phiên đăng nhập không phải customer');
    }

    final userId = current.userId ??
        _toInt(payload['userId'] ?? jwtPayload['userId'] ?? jwtPayload['sub']);

    if (userId == null) {
      await clearSession();
      throw ApiException('Không xác định được customerId sau refresh');
    }

    _session = current.copyWith(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      role: role,
      sessionId: current.sessionId ??
          payload['sessionId']?.toString() ??
          jwtPayload['sessionId']?.toString() ??
          jwtPayload['sid']?.toString(),
    );

    await _persistSession();
  }

  Future<Map<String, dynamic>> createOrder({
    required String serviceType,
    required String address,
    double? lat,
    double? lng,
    num? price,
  }) async {
    final current = _requireCustomerSession();

    final response = await _authorizedRequest(
      'POST',
      '/orders',
      body: {
        'customerId': current.userId,
        'serviceType': serviceType.trim(),
        'address': address.trim(),
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (price != null) 'price': price,
      },
    );

    if (response is Map<String, dynamic>) {
      return _extractPayloadMap(response);
    }

    throw ApiException('Backend create order response không hợp lệ');
  }

  Future<List<Map<String, dynamic>>> getMyOrders({
    int page = 1,
    int limit = 20,
  }) async {
    final current = _requireCustomerSession();

    final response = await _authorizedRequest(
      'GET',
      '/orders/customer/${current.userId}?page=$page&limit=$limit',
    );

    return _extractList(response)
        .whereType<Map<String, dynamic>>()
        .toList(growable: false);
  }

  Future<Map<String, dynamic>> getOrderDetail(int orderId) async {
    _requireCustomerSession();

    final response = await _authorizedRequest('GET', '/orders/$orderId');

    if (response is Map<String, dynamic>) {
      return _extractPayloadMap(response);
    }

    throw ApiException('Backend order detail response không hợp lệ');
  }

  SessionSnapshot _requireCustomerSession() {
    final current = _session;

    if (current == null || !current.isCustomer) {
      throw ApiException('Chưa đăng nhập customer');
    }

    if (current.userId == null) {
      throw ApiException('Không xác định được customerId từ session');
    }

    return current;
  }

  Future<dynamic> _authorizedRequest(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool retryOnUnauthorized = true,
  }) async {
    await init();

    var current = _session;
    if (current == null || !current.isCustomer) {
      throw ApiException('Chưa đăng nhập customer');
    }

    if (_isJwtExpired(current.accessToken)) {
      await refreshSession();
      current = _session;
    }

    if (current == null || !current.isCustomer) {
      throw ApiException('Phiên đăng nhập đã hết hạn');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${current.accessToken}',
    };

    late http.Response response;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await _client
            .get(uri, headers: headers)
            .timeout(const Duration(seconds: 15));
        break;
      case 'POST':
        response = await _client
            .post(
              uri,
              headers: headers,
              body: body == null ? null : jsonEncode(body),
            )
            .timeout(const Duration(seconds: 15));
        break;
      case 'PUT':
        response = await _client
            .put(
              uri,
              headers: headers,
              body: body == null ? null : jsonEncode(body),
            )
            .timeout(const Duration(seconds: 15));
        break;
      default:
        throw ApiException('HTTP method không được hỗ trợ: $method');
    }

    final decoded = _decodeResponse(response);

    final isUnauthorized =
        response.statusCode == 401 ||
        (decoded is Map<String, dynamic> &&
            decoded['success'] == false &&
            _extractErrorCode(decoded) == 'AUTHENTICATION_ERROR');

    if (isUnauthorized && retryOnUnauthorized) {
      try {
        await refreshSession();
        return _authorizedRequest(
          method,
          path,
          body: body,
          retryOnUnauthorized: false,
        );
      } catch (_) {
        await clearSession();
        throw ApiException('Phiên đăng nhập đã hết hạn');
      }
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractErrorMessage(decoded, fallback: 'API request thất bại'),
        statusCode: response.statusCode,
      );
    }

    if (decoded is Map<String, dynamic> && decoded['success'] == false) {
      throw ApiException(
        _extractErrorMessage(decoded, fallback: 'API request thất bại'),
        statusCode: response.statusCode,
      );
    }

    return decoded;
  }

  Future<void> clearSession() async {
    await init();

    _session = null;

    await _prefs!.remove(_accessTokenKey);
    await _prefs!.remove(_refreshTokenKey);
    await _prefs!.remove(_userIdKey);
    await _prefs!.remove(_roleKey);
    await _prefs!.remove(_sessionIdKey);
    await _prefs!.remove(_nameKey);
    await _prefs!.remove(_emailKey);
    await _prefs!.remove(_phoneKey);
  }

  Future<void> _loadSessionFromStorage() async {
    final accessToken = _prefs?.getString(_accessTokenKey);
    final refreshToken = _prefs?.getString(_refreshTokenKey);

    if (accessToken == null ||
        accessToken.isEmpty ||
        refreshToken == null ||
        refreshToken.isEmpty) {
      _session = null;
      return;
    }

    final jwtPayload = _decodeJwtPayload(accessToken);

    _session = SessionSnapshot(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: _prefs?.getInt(_userIdKey) ??
          _toInt(jwtPayload['userId'] ?? jwtPayload['sub']),
      role: _prefs?.getString(_roleKey) ??
          jwtPayload['role']?.toString().toLowerCase(),
      sessionId: _prefs?.getString(_sessionIdKey) ??
          jwtPayload['sessionId']?.toString() ??
          jwtPayload['sid']?.toString(),
      name: _prefs?.getString(_nameKey),
      email: _prefs?.getString(_emailKey),
      phone: _prefs?.getString(_phoneKey),
    );
  }

  Future<void> _persistSession() async {
    await init();

    final current = _session;
    if (current == null) return;

    await _prefs!.setString(_accessTokenKey, current.accessToken);
    await _prefs!.setString(_refreshTokenKey, current.refreshToken);

    if (current.userId != null) {
      await _prefs!.setInt(_userIdKey, current.userId!);
    } else {
      await _prefs!.remove(_userIdKey);
    }

    if (current.role != null) {
      await _prefs!.setString(_roleKey, current.role!);
    } else {
      await _prefs!.remove(_roleKey);
    }

    if (current.sessionId != null) {
      await _prefs!.setString(_sessionIdKey, current.sessionId!);
    } else {
      await _prefs!.remove(_sessionIdKey);
    }

    if (current.name != null) {
      await _prefs!.setString(_nameKey, current.name!);
    } else {
      await _prefs!.remove(_nameKey);
    }

    if (current.email != null) {
      await _prefs!.setString(_emailKey, current.email!);
    } else {
      await _prefs!.remove(_emailKey);
    }

    if (current.phone != null) {
      await _prefs!.setString(_phoneKey, current.phone!);
    } else {
      await _prefs!.remove(_phoneKey);
    }
  }

  dynamic _decodeResponse(http.Response response) {
    if (response.body.isEmpty) {
      return <String, dynamic>{};
    }

    try {
      return jsonDecode(response.body);
    } catch (_) {
      return {'message': response.body};
    }
  }

  Map<String, dynamic> _extractPayloadMap(dynamic response) {
    if (response is Map<String, dynamic>) {
      final data = response['data'];

      if (data is Map<String, dynamic>) {
        return data;
      }

      return response;
    }

    return <String, dynamic>{};
  }

  List<dynamic> _extractList(dynamic response) {
    if (response is List) return response;

    if (response is Map<String, dynamic>) {
      final data = response['data'];

      if (data is List) return data;

      if (data is Map<String, dynamic>) {
        final candidates = [
          data['items'],
          data['results'],
          data['orders'],
        ];

        for (final candidate in candidates) {
          if (candidate is List) return candidate;
        }
      }

      final candidates = [
        response['items'],
        response['results'],
        response['orders'],
      ];

      for (final candidate in candidates) {
        if (candidate is List) return candidate;
      }
    }

    return const [];
  }

  String _extractErrorMessage(dynamic body, {required String fallback}) {
    if (body is Map<String, dynamic>) {
      final message = body['message'];
      if (message is String && message.isNotEmpty) return message;
      if (message is List && message.isNotEmpty) return message.join(', ');

      final error = body['error'];
      if (error is String && error.isNotEmpty) return error;

      if (error is Map<String, dynamic>) {
        final nestedMessage = error['message'];
        if (nestedMessage is String && nestedMessage.isNotEmpty) {
          return nestedMessage;
        }
        if (nestedMessage is List && nestedMessage.isNotEmpty) {
          return nestedMessage.join(', ');
        }
      }
    }

    return fallback;
  }

  String? _extractErrorCode(dynamic body) {
    if (body is Map<String, dynamic>) {
      final code = body['code'];
      if (code is String && code.isNotEmpty) return code;

      final error = body['error'];
      if (error is Map<String, dynamic>) {
        final nestedCode = error['code'];
        if (nestedCode is String && nestedCode.isNotEmpty) return nestedCode;
      }
    }

    return null;
  }

  String? _extractString(
    Map<String, dynamic> body, {
    required List<String> keys,
  }) {
    for (final key in keys) {
      final value = body[key];
      if (value is String && value.isNotEmpty) return value;
    }
    return null;
  }

  int? _toInt(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    return null;
  }

  bool _isJwtExpired(String token, {int leewaySeconds = 30}) {
    final payload = _decodeJwtPayload(token);
    final exp = payload['exp'];

    if (exp is! num) return false;

    final nowSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return exp <= nowSeconds + leewaySeconds;
  }

  Map<String, dynamic> _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return {};

      final normalized = base64Url.normalize(parts[1]);
      final payloadString = utf8.decode(base64Url.decode(normalized));
      final payload = jsonDecode(payloadString);

      if (payload is Map<String, dynamic>) return payload;

      return {};
    } catch (_) {
      return {};
    }
  }
}