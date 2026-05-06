function fromZalo(body) {
  return {
    platform: 'zalo',
    senderId: body.sender?.id || body.user_id || 'unknown',
    text: body.message?.text || '',
    rawType: body.event_name || 'message',
  };
}

function fromFacebook(body) {
  const messaging = body.entry?.[0]?.messaging?.[0];

  return {
    platform: 'facebook',
    senderId: messaging?.sender?.id || 'unknown',
    text: messaging?.message?.text || '',
    rawType: 'message',
  };
}

module.exports = {
  fromZalo,
  fromFacebook,
};