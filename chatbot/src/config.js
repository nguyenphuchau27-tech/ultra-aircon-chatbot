require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

const config = {
  port: Number(process.env.CHATBOT_PORT || 5000),
  backendBaseUrl: required('BACKEND_BASE_URL').replace(/\/$/, ''),
  customerEmail: required('BOT_CUSTOMER_EMAIL'),
  customerPassword: required('BOT_CUSTOMER_PASSWORD'),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 8000),
};

module.exports = { config };