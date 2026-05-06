import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  Position? _currentPosition;
  bool _loading = false;
  bool _liveTracking = false;
  bool _updatingLocation = false;
  StreamSubscription<Position>? _positionSubscription;
  DateTime? _lastSentAt;

  @override
  void dispose() {
    _positionSubscription?.cancel();
    super.dispose();
  }

  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showError('Location services are disabled');
      return false;
    }

    var permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      _showError('Location permission denied');
      return false;
    }

    if (permission == LocationPermission.deniedForever) {
      _showError(
        'Location permission denied forever. Hãy bật quyền location trong settings.',
      );
      return false;
    }

    return true;
  }

  Future<void> _getCurrentLocation() async {
    final hasPermission = await _ensureLocationPermission();
    if (!hasPermission) return;

    try {
      if (mounted) {
        setState(() => _loading = true);
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      if (!mounted) return;

      setState(() {
        _currentPosition = position;
      });
    } catch (e) {
      _showError('Lấy vị trí thất bại: $e');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _updateLocationToServer({
    required double latitude,
    required double longitude,
    bool silent = false,
  }) async {
    if (_updatingLocation) return;

    try {
      if (mounted) {
        setState(() => _updatingLocation = true);
      }

      await ApiService.instance.updateOwnLocation(
        latitude: latitude,
        longitude: longitude,
      );

      if (!mounted) return;

      if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã cập nhật vị trí')),
        );
      }
    } catch (e) {
      if (!silent) {
        _showError('Update failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _updatingLocation = false);
      }
    }
  }

  Future<void> _updateLocation() async {
    if (_currentPosition == null) {
      await _getCurrentLocation();
      if (_currentPosition == null) return;
    }

    await _updateLocationToServer(
      latitude: _currentPosition!.latitude,
      longitude: _currentPosition!.longitude,
    );
  }

  Future<void> _startLiveTracking() async {
    final ok = await _ensureLocationPermission();
    if (!ok) return;

    await _positionSubscription?.cancel();

    if (!mounted) return;
    setState(() {
      _liveTracking = true;
    });

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 0,
      ),
    ).listen(
      (position) async {
        if (!mounted) return;

        debugPrint('[TRACKING] new position: ${position.latitude}, ${position.longitude}');

        setState(() {
          _currentPosition = position;
        });

        final now = DateTime.now();

        if (_lastSentAt != null &&
            now.difference(_lastSentAt!).inSeconds < 3) {
          return;
        }

        _lastSentAt = now;

        debugPrint('[TRACKING] sending to server...');

        await _updateLocationToServer(
          latitude: position.latitude,
          longitude: position.longitude,
          silent: true,
        );
      },
      onError: (error) {
        debugPrint('[TRACKING ERROR]: $error');
        _showError('Live tracking lỗi: $error');
        _stopLiveTracking();
      },
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã bật live tracking')),
    );
  }

  Future<void> _stopLiveTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;

    if (!mounted) return;
    setState(() {
      _liveTracking = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã tắt live tracking')),
    );
  }

  Future<void> _toggleLiveTracking() async {
    if (_liveTracking) {
      await _stopLiveTracking();
    } else {
      await _startLiveTracking();
    }
  }

  void _showError(String msg) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lat = _currentPosition?.latitude.toStringAsFixed(6) ?? '-';
    final lng = _currentPosition?.longitude.toStringAsFixed(6) ?? '-';

    final isBusy = _loading || _updatingLocation;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tracking'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              child: ListTile(
                title: const Text('Vị trí hiện tại'),
                subtitle: Text('Lat: $lat\nLng: $lng'),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: isBusy ? null : _getCurrentLocation,
              child: const Text('Lấy vị trí'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: isBusy ? null : _updateLocation,
              child: const Text('Update ngay'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _toggleLiveTracking,
              child: Text(
                _liveTracking ? 'Tắt live tracking' : 'Bật live tracking',
              ),
            ),
            if (isBusy)
              const Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
}