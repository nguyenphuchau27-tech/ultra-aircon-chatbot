const express = require('express');

const app = express();

app.use(express.json());

app.post('/zalo-webhook', (req, res) => {
  const message = req.body.message?.text;

  console.log('Zalo message:', message);

  res.sendStatus(200);
});

app.listen(5001, () => {
  console.log('Zalo bot running');
});
