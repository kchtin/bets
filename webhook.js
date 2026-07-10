const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'sixhe-webhook-secret';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/opt/sixhe/deploy.sh';

function verifySignature(body, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  const expected = `sha256=${hmac}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.statusCode = 404;
    res.end('not found');
    return;
  }

  const signature = req.headers['x-hub-signature-256'] || '';
  const event = req.headers['x-github-event'] || '';
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    if (!verifySignature(body, signature)) {
      res.statusCode = 403;
      res.end('invalid signature');
      return;
    }

    if (event === 'ping') {
      res.statusCode = 200;
      res.end('pong');
      return;
    }

    if (event !== 'push') {
      res.statusCode = 200;
      res.end('ignored');
      return;
    }

    res.statusCode = 202;
    res.end('accepted');

    console.log(`[${new Date().toISOString()}] push webhook received, deploying...`);
    const child = spawn('bash', [DEPLOY_SCRIPT], {
      stdio: 'inherit',
      env: { ...process.env },
    });
    child.on('close', (code) => {
      console.log(`[${new Date().toISOString()}] deploy exited with code ${code}`);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] webhook server listening on port ${PORT}`);
});
