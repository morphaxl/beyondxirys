const config = require('./test.env.config.js');
const env = process.argv[2];

if (!env || !config[env]) {
  console.error(`Unknown or missing environment: ${env}`);
  process.exit(1);
}

Object.entries(config[env]).forEach(([key, value]) => {
  process.env[key] = value;
}); 