const express = require('express');

const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const message = req.body.entry?.[0]?.messaging?.[0]?.message?.text;

  console.log('FB Message:', message);

  res.sendStatus(200);
});

app.listen(5000, () => {
  console.log('Facebook bot running');
});
