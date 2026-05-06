import 'job_detail_screen.dart';

import 'package:flutter/material.dart';

import '../services/api_service.dart';
import 'login_screen.dart';
import 'tracking_screen.dart';

class TechnicianDashboard extends StatefulWidget {
  const TechnicianDashboard({super.key});

  @override
  State<TechnicianDashboard> createState() => _TechnicianDashboardState();
}

class _TechnicianDashboardState extends State<TechnicianDashboard> {
  bool _bootstrapping = true;
  bool _loading = false;
  bool _actionLoading = false;

  String? _errorMessage;
  List<Map<String, dynamic>> _jobs = [];

  SessionSnapshot? get _session => ApiService.instance.session;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    if (mounted) {
      setState(() {
        _bootstrapping = true;
        _errorMessage = null;
      });
    }

    try {
      if (ApiService.instance.session == null) {
        final restored = await ApiService.instance.restoreSession();

        if (!restored || ApiService.instance.session == null) {
          if (!mounted) return;
          setState(() {
            _jobs = [];
            _errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          });
          return;
        }
      }

      try {
        await ApiService.instance.resolveTechnicianId(forceRefresh: false);
      } catch (_) {}

      await _loadJobs(silent: true);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = _normalizeError(error);
      });
    } finally {
      if (mounted) {
        setState(() {
          _bootstrapping = false;
        });
      }
    }
  }

  Future<void> _loadJobs({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _errorMessage = null;
      });
    } else {
      setState(() {
        _errorMessage = null;
      });
    }

    try {
      final jobs = await ApiService.instance.getTechnicianJobs();
      if (!mounted) return;

      setState(() {
        _jobs = _sortJobs(jobs);
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _errorMessage = _normalizeError(error);
      });
    } finally {
      if (mounted && !silent) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _refreshAll() async {
    await _bootstrap();
  }

  Future<void> _logout() async {
    setState(() {
      _actionLoading = true;
    });

    try {
      await ApiService.instance.logout();
    } catch (_) {
      // Logout local vẫn nên đi tiếp
    } finally {
      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _openTracking() async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const TrackingScreen()),
    );

    if (!mounted) return;
    await _refreshAll();
  }

  Future<void> _showJobDetail(Map<String, dynamic> job) async {
    final orderId = _toInt(job['id']);
    if (orderId == null) {
      _showSnack('Không xác định được mã job.', isError: true);
      return;
    }

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => JobDetailScreen(orderId: orderId),
      ),
    );

    if (!mounted) return;
    await _refreshAll();
  }

  Future<void> _updateStatus(int orderId, String nextStatus) async {
    setState(() {
      _actionLoading = true;
    });

    try {
      await ApiService.instance.updateOrderStatus(
        orderId: orderId,
        status: nextStatus,
      );

      _showSnack('Đã cập nhật job #$orderId → $nextStatus');
      await _refreshAll();
    } catch (error) {
      _showSnack(_normalizeError(error), isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _actionLoading = false;
        });
      }
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : null,
      ),
    );
  }

  String _normalizeError(Object error) {
    final text = error.toString();
    return text
        .replaceFirst('Exception: ', '')
        .replaceFirst('ApiException: ', '');
  }

  int? _toInt(dynamic value) {
    if (value is int) return value;
    final parsed = int.tryParse(value?.toString() ?? '');
    return parsed;
  }

  String _read(dynamic value, {String fallback = '-'}) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  int _countByStatus(String status) {
    return _jobs
        .where((job) => _read(job['status']).toLowerCase() == status)
        .length;
  }

  @override
  Widget build(BuildContext context) {
    final session = _session;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Technician Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Tracking',
            onPressed: (_bootstrapping || _actionLoading) ? null : _openTracking,
            icon: const Icon(Icons.my_location),
          ),
          IconButton(
            tooltip: 'Refresh',
            onPressed: (_bootstrapping || _loading) ? null : _refreshAll,
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Logout',
            onPressed: _actionLoading ? null : _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Wrap(
                  runSpacing: 12,
                  spacing: 12,
                  children: [
                    _InfoChip(
                      label: 'Role',
                      value: _read(session?.role),
                      icon: Icons.badge_outlined,
                    ),
                    _InfoChip(
                      label: 'User ID',
                      value: _read(session?.userId),
                      icon: Icons.person_outline,
                    ),
                    _InfoChip(
                      label: 'Technician ID',
                      value: _read(session?.technicianId),
                      icon: Icons.engineering_outlined,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _SummaryCard(
                    title: 'Tổng job',
                    value: '${_jobs.length}',
                    icon: Icons.work_outline,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SummaryCard(
                    title: 'Assigned',
                    value: '${_countByStatus('assigned')}',
                    icon: Icons.assignment_late_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _SummaryCard(
                    title: 'In Progress',
                    value: '${_countByStatus('in_progress')}',
                    icon: Icons.build_circle_outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SummaryCard(
                    title: 'Completed',
                    value: '${_countByStatus('completed')}',
                    icon: Icons.task_alt_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_bootstrapping)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
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
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _refreshAll,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Thử lại'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _logout,
                            icon: const Icon(Icons.logout),
                            label: const Text('Đăng xuất'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              )
            else if (_jobs.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Hiện technician chưa có job nào được assign.'),
                ),
              )
            else
              ..._jobs.map((job) {
                final orderId = _toInt(job['id']) ?? 0;
                final status = _read(job['status']).toLowerCase();

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Job #$orderId',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text('Status: ${_read(job['status'])}'),
                        Text(
                          'Address: ${_read(job['address'] ?? job['serviceAddress'])}',
                        ),
                        Text(
                          'Service: ${_read(job['serviceType'] ?? job['title'])}',
                        ),
                        Text(
                          'Customer: ${_read(job['customer']?['name'] ?? job['customerName'])}',
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => _showJobDetail(job),
                              icon: const Icon(Icons.visibility_outlined),
                              label: const Text('Chi tiết'),
                            ),
                            if (status == 'assigned')
                              FilledButton.icon(
                                onPressed: _actionLoading
                                    ? null
                                    : () => _updateStatus(orderId, 'in_progress'),
                                icon: const Icon(Icons.play_arrow),
                                label: const Text('Bắt đầu'),
                              ),
                            if (status == 'in_progress')
                              FilledButton.icon(
                                onPressed: _actionLoading
                                    ? null
                                    : () => _updateStatus(orderId, 'completed'),
                                icon: const Icon(Icons.check_circle_outline),
                                label: const Text('Hoàn thành'),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
  List<Map<String, dynamic>> _sortJobs(List<Map<String, dynamic>> jobs) {
    final priority = {
      'in_progress': 0,
      'assigned': 1,
      'pending': 2,
      'completed': 3,
      'cancelled': 4,
    };

    final sorted = [...jobs];

    sorted.sort((a, b) {
      final statusA = _read(a['status']).toLowerCase();
      final statusB = _read(b['status']).toLowerCase();

      final pA = priority[statusA] ?? 99;
      final pB = priority[statusB] ?? 99;

      if (pA != pB) return pA.compareTo(pB);

      final idA = _toInt(a['id']) ?? 0;
      final idB = _toInt(b['id']) ?? 0;

      return idB.compareTo(idA);
    });

    return sorted;
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _InfoChip({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 18),
      label: Text('$label: $value'),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}