import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MapTrackingScreen extends StatefulWidget {

  @override
  _MapTrackingScreenState createState() => _MapTrackingScreenState();

}

class _MapTrackingScreenState extends State<MapTrackingScreen>{

GoogleMapController? mapController;

final LatLng technician = LatLng(10.762622,106.660172);

@override
Widget build(BuildContext context){

return Scaffold(

appBar: AppBar(title: Text("Technician Tracking")),

body: GoogleMap(

initialCameraPosition: CameraPosition(
target: technician,
zoom: 14
),

markers: {
Marker(
markerId: MarkerId("tech"),
position: technician
)
}

)

);

}

}