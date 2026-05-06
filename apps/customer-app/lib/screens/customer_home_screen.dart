import 'package:flutter/material.dart';

import '../services/api_service.dart';
import 'create_order_screen.dart';
import 'login_screen.dart';
import 'order_detail_screen.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  bool _loading = true;
  bool _actionLoading = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _orders = [];

  SessionSnapshot? get _session => ApiService.instance.session;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final orders = await ApiService.instance.getMyOrders();
      if (!mounted) return;
      setState(() {
        _orders = _sortOrders(orders);
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = _normalizeError(error);
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _logout() async {
    setState(() {
      _actionLoading = true;
    });

    await ApiService.instance.logout();

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _openCreateOrder() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CreateOrderScreen()),
    );

    if (!mounted) return;
    if (created == true) {
      await _loadOrders();
    }
  }

  Future<void> _openOrderDetail(int orderId) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
    );

    if (!mounted) return;
    await _loadOrders();
  }

  String _normalizeError(Object error) {
    return error.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', '');
  }

  int? _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }

  String _read(dynamic value, {String fallback = '-'}) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  List<Map<String, dynamic>> _sortOrders(List<Map<String, dynamic>> orders) {
    final sorted = [...orders];
    sorted.sort((a, b) {
      final idA = _toInt(a['id']) ?? 0;
      final idB = _toInt(b['id']) ?? 0;
      return idB.compareTo(idA);
    });
    return sorted;
  }

  @override
  Widget build(BuildContext context) {
    final session = _session;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đơn của tôi'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _loadOrders,
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Logout',
            onPressed: _actionLoading ? null : _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateOrder,
        icon: const Icon(Icons.add),
        label: const Text('Tạo đơn'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Customer session', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('Tên: ${_read(session?.name)}'),
                    Text('Email: ${_read(session?.email)}'),
                    Text('Customer ID: ${_read(session?.userId)}'),
                    Text('Role: ${_read(session?.role)}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 80),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_errorMessage != null)
              Card(
                color: Colors.red.withOpacity(0.06),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _loadOrders,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Thử lại'),
                      ),
                    ],
                  ),
                ),
              )
            else if (_orders.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Bạn chưa có đơn nào. Bấm “Tạo đơn” để tạo order thật qua backend.'),
                ),
              )
            else
              ..._orders.map((order) {
                final orderId = _toInt(order['id']);
                final technician = order['technician'] is Map<String, dynamic>
                    ? order['technician'] as Map<String, dynamic>
                    : null;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    onTap: orderId == null ? null : () => _openOrderDetail(orderId),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Order #${_read(order['id'])}', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          Text('Dịch vụ: ${_read(order['serviceType'])}'),
                          Text('Địa chỉ: ${_read(order['address'])}'),
                          Text('Trạng thái: ${_read(order['status'])}'),
                          Text('Technician: ${_read(technician?['name'], fallback: 'Chưa assign')}'),
                          Text('Tạo lúc: ${_read(order['createdAt'])}'),
                        ],
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
