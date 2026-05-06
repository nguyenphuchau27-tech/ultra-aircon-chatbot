function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s:.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectIntent(text) {
  const normalized = normalizeText(text);

  const has = (kw) => normalized.includes(kw);

  const hasAircon = has('may lanh');
  const hasBroken =
    has('khong lanh') ||
    has('bi hu') ||
    has('hong') ||
    has('khong chay');

  const hasOrder =
    has('tao don') ||
    has('dat lich') ||
    has('dat') ||
    has('tao');

  // ✅ CREATE ORDER INTENT
  if (
    (hasAircon && hasBroken) ||
    has('sua may lanh') ||
    has('ve sinh may lanh') ||
    (hasOrder && hasAircon)
  ) {
    return {
      intent: 'create_order',
      confidence: 0.9,
      entities: {
        serviceType: extractServiceType(normalized),
        issue: extractIssue(normalized),
        address: extractAddress(text),
      },
      normalized,
    };
  }

  // ✅ VIEW ORDERS
  if (
    has('xem don') ||
    has('don cua toi') ||
    has('kiem tra don') ||
    has('trang thai don')
  ) {
    return {
      intent: 'view_orders',
      confidence: 0.9,
      entities: {
        serviceType: extractServiceType(normalized),
        issue: extractIssue(normalized),
        address: extractAddress(text),
      },
      normalized,
    };
  }

  return {
    intent: 'unknown',
    confidence: 0.3,
    entities: {
      serviceType: extractServiceType(normalized),
      issue: extractIssue(normalized),
      address: extractAddress(text),
    },
    normalized,
  };
}

function extractServiceType(normalized) {
  if (normalized.includes('ve sinh')) return 'cleaning';
  if (normalized.includes('bao tri')) return 'maintenance';
  return 'repair';
}

function extractIssue(normalized) {
  if (normalized.includes('khong lanh')) return 'not_cooling';
  if (normalized.includes('bi hu') || normalized.includes('hong')) return 'broken';
  if (normalized.includes('khong chay')) return 'not_running';
  if (normalized.includes('ve sinh')) return 'needs_cleaning';
  return 'general_aircon_service';
}

function extractAddress(text) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(?:dia chi|address)\s*[:\-]\s*(.+)$/i);
  return match?.[1]?.trim() || null;
}

module.exports = {
  detectIntent,
  normalizeText,
};