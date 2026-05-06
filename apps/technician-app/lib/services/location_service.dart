import 'package:geolocator/geolocator.dart';

class LocationService {
  Future<void> ensurePermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Thiết bị đang tắt Location Services');
    }

    var permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw Exception('Quyền truy cập vị trí đã bị từ chối');
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception(
        'Quyền truy cập vị trí đã bị từ chối vĩnh viễn. Hãy bật lại trong Settings.',
      );
    }
  }

  Future<Position> getCurrentLocation() async {
    await ensurePermission();

    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.best,
    );
  }

  Stream<Position> positionStream() async* {
    await ensurePermission();

    yield* Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 10,
      ),
    );
  }
}