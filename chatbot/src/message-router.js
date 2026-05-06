const { detectIntent } = require('./ai/intent-detector');
const { executeAction } = require('./ai/action-mapper');
const {
  getConversation,
  setConversation,
  clearConversation,
} = require('./conversation-store');
const { safeLog, maskText } = require('./safe-log');

function normalizeLocal(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s:.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCancelIntent(text) {
  const normalized = normalizeLocal(text);

  return (
    normalized === 'huy' ||
    normalized === 'cancel' ||
    normalized.includes('huy don') ||
    normalized.includes('thoi khong') ||
    normalized.includes('khong tao nua')
  );
}

function looksLikeAddress(text) {
  const normalized = normalizeLocal(text);

  return (
    /\d+/.test(normalized) ||
    normalized.includes('duong') ||
    normalized.includes('quan') ||
    normalized.includes('phuong') ||
    normalized.includes('tran') ||
    normalized.includes('nguyen') ||
    normalized.includes('le ')
  );
}

async function routeMessage(message) {
  const text = String(message.text || '').trim();

  if (isCancelIntent(text)) {
    clearConversation(message);

    safeLog('conversation_cancelled', {
      platform: message.platform,
      senderId: message.senderId,
    });

    return 'Em đã hủy thao tác hiện tại. Anh/chị có thể nhắn lại khi cần tạo đơn.';
  }

  const existingState = getConversation(message);

  if (existingState?.status === 'waiting_for_address') {
    if (!looksLikeAddress(text)) {
      return 'Anh/chị vui lòng gửi địa chỉ cụ thể để em tạo đơn, hoặc nhắn "hủy" để dừng.';
    }

    const completedIntent = {
      intent: 'create_order',
      confidence: 0.95,
      entities: {
        ...existingState.entities,
        address: text,
      },
      normalized: normalizeLocal(text),
    };

    clearConversation(message);
    return executeAction(completedIntent);
  }

  const intentResult = detectIntent(text);

  safeLog('intent_detected', {
    platform: message.platform,
    senderId: message.senderId,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    text: maskText(text),
    normalized: maskText(intentResult.normalized),
  });

  if (intentResult.intent === 'create_order' && !intentResult.entities.address) {
    setConversation(message, {
      status: 'waiting_for_address',
      intent: 'create_order',
      entities: intentResult.entities,
    });

    return 'Anh/chị cho em địa chỉ để tạo đơn sửa máy lạnh nhé.';
  }

  return executeAction(intentResult);
}

module.exports = {
  routeMessage,
};