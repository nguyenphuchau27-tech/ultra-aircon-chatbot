const conversations = new Map();

const DEFAULT_TTL_MS = 10 * 60 * 1000;

function getKey(message) {
  return `${message.platform}:${message.senderId}`;
}

function isExpired(state) {
  if (!state?.updatedAt) return true;
  return Date.now() - state.updatedAt > DEFAULT_TTL_MS;
}

function getConversation(message) {
  const key = getKey(message);
  const state = conversations.get(key);

  if (!state) return null;

  if (isExpired(state)) {
    conversations.delete(key);
    return null;
  }

  return state;
}

function setConversation(message, state) {
  conversations.set(getKey(message), {
    ...state,
    updatedAt: Date.now(),
  });
}

function clearConversation(message) {
  conversations.delete(getKey(message));
}

module.exports = {
  getConversation,
  setConversation,
  clearConversation,
};