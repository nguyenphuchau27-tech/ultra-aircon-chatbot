import 'package:http/http.dart' as http;

class Api{

static const base="http://localhost";

static Future getOrders() async{

final res = await http.get(
Uri.parse("$base/orders")
);

return res.body;

}

}