const express = require('express');
const { config } = require('./config');
const { fromZalo, fromFacebook } = require('./inbound-message');
const { routeMessage } = require('./message-router');
const { safeLog } = require('./safe-log');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'ultra-aircon-chatbot-adapter',
  });
});

app.post('/zalo-webhook', async (req, res) => {
  try {
    const inbound = fromZalo(req.body);
    safeLog('zalo_inbound', {
      senderId: inbound.senderId,
      hasText: Boolean(inbound.text),
    });

    const reply = await routeMessage(inbound);

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    safeLog('zalo_error', {
      message: error.message,
    });

    res.status(200).json({
      success: false,
      reply: 'Hệ thống đang bận, vui lòng thử lại sau.',
    });
  }
});

app.post('/facebook-webhook', async (req, res) => {
  try {
    const inbound = fromFacebook(req.body);
    safeLog('facebook_inbound', {
      senderId: inbound.senderId,
      hasText: Boolean(inbound.text),
    });

    const reply = await routeMessage(inbound);

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    safeLog('facebook_error', {
      message: error.message,
    });

    res.status(200).json({
      success: false,
      reply: 'Hệ thống đang bận, vui lòng thử lại sau.',
    });
  }
});

app.listen(config.port, () => {
  console.log(`[chatbot] running on http://localhost:${config.port}`);
});