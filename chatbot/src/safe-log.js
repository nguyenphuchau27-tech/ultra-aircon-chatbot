function maskText(value) {
  const text = String(value || '');

  if (!text) {
    return {
      length: 0,
      preview: '',
    };
  }

  return {
    length: text.length,
    preview: text.length > 12 ? `${text.slice(0, 12)}...` : text,
  };
}

function removeSensitiveFields(input) {
  if (!input || typeof input !== 'object') return input;

  const blockedKeys = new Set([
    'password',
    'accesstoken',
    'refreshtoken',
    'token',
    'authorization',
    'cookie',
    'session',
  ]);

  const output = Array.isArray(input) ? [] : {};

  for (const [key, value] of Object.entries(input)) {
    if (blockedKeys.has(key.toLowerCase())) {
      output[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      output[key] = removeSensitiveFields(value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function safeLog(event, details = {}) {
  console.log(`[chatbot] ${event}`, removeSensitiveFields(details));
}

module.exports = {
  safeLog,
  maskText,
  removeSensitiveFields,
};