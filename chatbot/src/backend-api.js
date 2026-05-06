const { config } = require('./config');
const { safeLog } = require('./safe-log');

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.backendBaseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      safeLog('backend_request_failed', {
        path,
        status: response.status,
      });

      throw new Error('Backend request failed');
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function unwrap(body) {
  return body && body.data ? body.data : body;
}

async function loginCustomer() {
  const body = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: config.customerEmail,
      password: config.customerPassword,
      appType: 'chatbot',
      deviceType: 'server',
    }),
  });

  const data = unwrap(body);

  if (!data.accessToken || !data.user?.id) {
    throw new Error('Invalid login response from backend');
  }

  return {
    accessToken: data.accessToken,
    customerId: data.user.id,
  };
}

async function createOrder({ serviceType, address }) {
  const session = await loginCustomer();

  const body = await requestJson('/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({
      serviceType,
      address,
      customerId: session.customerId,
    }),
  });

  return unwrap(body);
}

async function getMyOrders() {
  const session = await loginCustomer();

  const body = await requestJson(`/orders/customer/${session.customerId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  return unwrap(body);
}

module.exports = {
  createOrder,
  getMyOrders,
};