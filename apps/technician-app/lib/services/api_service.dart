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
  final int? technicianId;

  const SessionSnapshot({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.role,
    required this.sessionId,
    required this.technicianId,
  });

  SessionSnapshot copyWith({
    String? accessToken,
    String? refreshToken,
    int? userId,
    String? role,
    String? sessionId,
    int? technicianId,
  }) {
    return SessionSnapshot(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      sessionId: sessionId ?? this.sessionId,
      technicianId: technicianId ?? this.technicianId,
    );
  }

  bool get isTechnician => (role ?? '').toLowerCase() == 'technician';
}

class ApiService {
  ApiService._internal();

  static final ApiService instance = ApiService._internal();

  final http.Client _client = http.Client();

  SharedPreferences? _prefs;
  SessionSnapshot? _session;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _roleKey = 'role';
  static const _sessionIdKey = 'session_id';
  static const _technicianIdKey = 'technician_id';

  SessionSnapshot? get session => _session;

  bool get isLoggedIn => _session != null;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<bool> restoreSession() async {
    await init();
    await _loadSessionFromStorage();

    if (_session == null) {
      return false;
    }

    if (_session!.refreshToken.isEmpty) {
      await clearSession();
      return false;
    }

    try {
      await refreshSession();
      return _session != null;
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

    final role = (payload['role'] ??
            payload['user']?['role'] ??
            jwtPayload['role'])
        ?.toString()
        .toLowerCase();

    final userId = _toInt(
      payload['userId'] ??
          payload['user']?['id'] ??
          payload['user']?['userId'] ??
          jwtPayload['userId'] ??
          jwtPayload['sub'],
    );

    final sessionId = (payload['sessionId'] ??
            payload['session']?['id'] ??
            jwtPayload['sessionId'] ??
            jwtPayload['sid'])
        ?.toString();

    final technicianId = _toInt(
      payload['technicianId'] ??
          payload['technician']?['id'] ??
          payload['user']?['technicianId'] ??
          jwtPayload['technicianId'],
    );

    final nextSession = SessionSnapshot(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      role: role,
      sessionId: sessionId,
      technicianId: technicianId,
    );

    if (!nextSession.isTechnician) {
      throw ApiException('Tài khoản này không phải technician');
    }

    _session = nextSession;
    await _persistSession();

    return {
      'success': true,
      'role': role,
      'userId': userId,
      'technicianId': technicianId,
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
      // Không chặn logout local nếu backend trả lỗi
    } finally {
      await clearSession();
    }
  }

  Future<void> refreshSession() async {
    await init();

    if (_session == null || _session!.refreshToken.isEmpty) {
      throw ApiException('Không có refresh token');
    }

    final response = await _client.post(
      Uri.parse('${ApiConfig.baseUrl}/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'refreshToken': _session!.refreshToken,
      }),
    );

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

    final role = (_session!.role ?? payload['role'] ?? jwtPayload['role'])
        ?.toString()
        .toLowerCase();

    final userId = _session!.userId ??
        _toInt(
          payload['userId'] ??
              payload['user']?['id'] ??
              payload['user']?['userId'] ??
              jwtPayload['userId'] ??
              jwtPayload['sub'],
        );

    final sessionId = (_session!.sessionId ??
            payload['sessionId'] ??
            payload['session']?['id'] ??
            jwtPayload['sessionId'] ??
            jwtPayload['sid'])
        ?.toString();

    final technicianId =
        _session!.technicianId ??
        _toInt(
          payload['technicianId'] ??
              payload['technician']?['id'] ??
              payload['user']?['technicianId'] ??
              jwtPayload['technicianId'],
        );

    _session = _session!.copyWith(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      role: role,
      sessionId: sessionId,
      technicianId: technicianId,
    );

    await _persistSession();
  }

  Future<int> resolveTechnicianId({bool forceRefresh = false}) async {
    await init();

    if (_session == null) {
      throw ApiException('Chưa đăng nhập');
    }

    if (!forceRefresh && _session!.technicianId != null) {
      return _session!.technicianId!;
    }

    if (_session!.userId == null) {
      throw ApiException('Không xác định được userId từ session');
    }

    final response = await _authorizedRequest(
      'GET',
      '/technicians?page=1&limit=100',
    );

    final technicians = _extractList(response);

    for (final item in technicians) {
      if (item is Map<String, dynamic>) {
        final itemUserId = _toInt(item['userId'] ?? item['user']?['id']);
        if (itemUserId == _session!.userId) {
          final technicianId = _toInt(item['id']);
          if (technicianId != null) {
            _session = _session!.copyWith(technicianId: technicianId);
            await _persistSession();
            return technicianId;
          }
        }
      }
    }

    throw ApiException(
      'Không resolve được technician profile từ user hiện tại. Backend nên bổ sung endpoint /technicians/me để sạch hơn.',
    );
  }

  Future<List<Map<String, dynamic>>> getTechnicianJobs({
    int page = 1,
    int limit = 20,
  }) async {
    final technicianId = await resolveTechnicianId();

    final response = await _authorizedRequest(
      'GET',
      '/orders/technician/$technicianId?page=$page&limit=$limit',
    );

    return _extractList(response)
        .whereType<Map<String, dynamic>>()
        .toList(growable: false);
  }

  Future<Map<String, dynamic>> getOrderDetail(int orderId) async {
    final response = await _authorizedRequest('GET', '/orders/$orderId');

    if (response is Map<String, dynamic>) {
      return _extractPayloadMap(response);
    }

    throw ApiException('Invalid order detail response');
  }

  Future<Map<String, dynamic>> updateOrderStatus({
    required int orderId,
    required String status,
  }) async {
    final response = await _authorizedRequest(
      'PUT',
      '/orders/$orderId/status',
      body: {'status': status},
    );

    if (response is Map<String, dynamic>) {
      final payload = _extractPayloadMap(response);
      return payload;
    }

    throw ApiException('Backend update status response không hợp lệ');
  }

  Future<Map<String, dynamic>> updateOwnLocation({
    required double latitude,
    required double longitude,
  }) async {
    final technicianId = await resolveTechnicianId();

    final response = await _authorizedRequest(
      'PUT',
      '/technicians/location/$technicianId',
      body: {
        'latitude': latitude,
        'longitude': longitude,
      },
    );

    if (response is Map<String, dynamic>) {
      return response;
    }

    throw ApiException('Backend update location response không hợp lệ');
  }

  Future<dynamic> _authorizedRequest(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool retryOnUnauthorized = true,
  }) async {
    await init();

    if (_session == null) {
      throw ApiException('Chưa đăng nhập');
    }

    if (_isJwtExpired(_session!.accessToken)) {
      await refreshSession();
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${_session!.accessToken}',
    };

    late http.Response response;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await _client.get(uri, headers: headers);
        break;
      case 'POST':
        response = await _client.post(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      case 'PUT':
        response = await _client.put(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      default:
        throw ApiException('HTTP method không được hỗ trợ: $method');
    }

    final decoded = _decodeResponse(response);

    if (response.statusCode == 401 &&
        retryOnUnauthorized &&
        _session?.refreshToken != null) {
      await refreshSession();
      return _authorizedRequest(
        method,
        path,
        body: body,
        retryOnUnauthorized: false,
      );
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
    await _prefs!.remove(_technicianIdKey);
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

    final payload = _decodeJwtPayload(accessToken);

    _session = SessionSnapshot(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId:
          _prefs?.getInt(_userIdKey) ??
          _toInt(payload['userId'] ?? payload['sub']),
      role:
          _prefs?.getString(_roleKey) ??
          payload['role']?.toString().toLowerCase(),
      sessionId:
          _prefs?.getString(_sessionIdKey) ??
          payload['sessionId']?.toString() ??
          payload['sid']?.toString(),
      technicianId:
          _prefs?.getInt(_technicianIdKey) ??
          _toInt(payload['technicianId']),
    );
  }

  Future<void> _persistSession() async {
    await init();

    if (_session == null) {
      return;
    }

    await _prefs!.setString(_accessTokenKey, _session!.accessToken);
    await _prefs!.setString(_refreshTokenKey, _session!.refreshToken);

    if (_session!.userId != null) {
      await _prefs!.setInt(_userIdKey, _session!.userId!);
    } else {
      await _prefs!.remove(_userIdKey);
    }

    if (_session!.role != null) {
      await _prefs!.setString(_roleKey, _session!.role!);
    } else {
      await _prefs!.remove(_roleKey);
    }

    if (_session!.sessionId != null) {
      await _prefs!.setString(_sessionIdKey, _session!.sessionId!);
    } else {
      await _prefs!.remove(_sessionIdKey);
    }

    if (_session!.technicianId != null) {
      await _prefs!.setInt(_technicianIdKey, _session!.technicianId!);
    } else {
      await _prefs!.remove(_technicianIdKey);
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
  String _extractErrorMessage(dynamic body, {required String fallback}) {
    if (body is Map<String, dynamic>) {
      final message = body['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }

      if (message is List && message.isNotEmpty) {
        return message.join(', ');
      }

      final error = body['error'];

      if (error is String && error.isNotEmpty) {
        return error;
      }

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

  String? _extractString(
    Map<String, dynamic> body, {
    required List<String> keys,
  }) {
    for (final key in keys) {
      final value = body[key];
      if (value is String && value.isNotEmpty) {
        return value;
      }
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

    if (exp is! num) {
      return false;
    }

    final nowSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return exp <= (nowSeconds + leewaySeconds);
  }

  Map<String, dynamic> _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) {
        return {};
      }

      final normalized = base64Url.normalize(parts[1]);
      final payloadString = utf8.decode(base64Url.decode(normalized));
      final payload = jsonDecode(payloadString);

      if (payload is Map<String, dynamic>) {
        return payload;
      }

      return {};
    } catch (_) {
      return {};
    }
  }
  
  List<dynamic> _extractList(dynamic response) {
    if (response is List) {
      return response;
    }

    if (response is Map<String, dynamic>) {
      final data = response['data'];

      if (data is List) {
        return data;
      }

      if (data is Map<String, dynamic>) {
        final candidates = [
          data['items'],
          data['results'],
          data['orders'],
          data['technicians'],
        ];

        for (final candidate in candidates) {
          if (candidate is List) {
            return candidate;
          }
        }
      }

      final candidates = [
        response['items'],
        response['results'],
        response['orders'],
        response['technicians'],
      ];

      for (final candidate in candidates) {
        if (candidate is List) {
          return candidate;
        }
      }
    }

    return const [];
  }
}