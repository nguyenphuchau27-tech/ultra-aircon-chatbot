const { exec } = require('child_process');

console.log('Running ESLint auto fix...');

exec('npm run lint:fix', (err, stdout, _stderr) => {
  if (err) {
    console.error('Lint error:', err);
    return;
  }

  if (_stderr) {
    console.error(_stderr);
  }

  console.log(stdout);
  console.log('Lint completed');
});
