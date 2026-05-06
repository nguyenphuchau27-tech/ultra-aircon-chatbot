class UltraAirconSDK {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  createOrder(service, location) {
    return fetch('/api/order', {
      method: 'POST',

      body: JSON.stringify({
        service,
        location,
        apiKey: this.apiKey,
      }),
    });
  }
}

export default UltraAirconSDK;
