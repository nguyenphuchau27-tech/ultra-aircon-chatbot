import 'package:flutter/material.dart';

import '../services/api_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({
    super.key,
    required this.orderId,
  });

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  bool _loading = true;
  String? _errorMessage;
  Map<String, dynamic>? _detail;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final detail = await ApiService.instance.getOrderDetail(widget.orderId);
      if (!mounted) return;
      setState(() {
        _detail = detail;
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

  String _normalizeError(Object error) {
    return error.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', '');
  }

  String _read(dynamic value, {String fallback = '-'}) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  @override
  Widget build(BuildContext context) {
    final detail = _detail;
    final customer = detail?['customer'] is Map<String, dynamic>
        ? detail!['customer'] as Map<String, dynamic>
        : null;
    final technician = detail?['technician'] is Map<String, dynamic>
        ? detail!['technician'] as Map<String, dynamic>
        : null;

    return Scaffold(
      appBar: AppBar(title: Text('Order #${widget.orderId}')),
      body: RefreshIndicator(
        onRefresh: _loadDetail,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
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
                  child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                ),
              )
            else if (detail == null)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Không tìm thấy order.'),
                ),
              )
            else ...[
              _SectionCard(
                title: 'Thông tin order',
                children: [
                  _DetailRow(label: 'Dịch vụ', value: _read(detail['serviceType'])),
                  _DetailRow(label: 'Trạng thái', value: _read(detail['status'])),
                  _DetailRow(label: 'Địa chỉ', value: _read(detail['address'])),
                  _DetailRow(label: 'Giá', value: _read(detail['price'])),
                  _DetailRow(label: 'Tạo lúc', value: _read(detail['createdAt'])),
                  _DetailRow(label: 'Cập nhật', value: _read(detail['updatedAt'])),
                ],
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Vị trí',
                children: [
                  _DetailRow(label: 'Lat', value: _read(detail['lat'])),
                  _DetailRow(label: 'Lng', value: _read(detail['lng'])),
                ],
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Khách hàng',
                children: [
                  _DetailRow(label: 'Tên', value: _read(customer?['name'])),
                  _DetailRow(label: 'Email', value: _read(customer?['email'])),
                  _DetailRow(label: 'Phone', value: _read(customer?['phone'])),
                ],
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Technician',
                children: [
                  _DetailRow(label: 'Tên', value: _read(technician?['name'], fallback: 'Chưa assign')),
                  _DetailRow(label: 'Phone', value: _read(technician?['phone'])),
                  _DetailRow(label: 'Skill', value: _read(technician?['skill'])),
                  _DetailRow(label: 'Rating', value: _read(technician?['rating'])),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
