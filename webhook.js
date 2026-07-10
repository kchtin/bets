const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'sixhe-webhook-secret';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/opt/sixhe/deploy.sh';
const DEPLOY_LOG = process.env.DEPLOY_LOG || '/opt/sixhe/deploy.log';

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

function readDeployLog() {
  try {
    const log = fs.readFileSync(DEPLOY_LOG, 'utf8');
    const lines = log.split('\n');
    return lines.slice(-200).join('\n');
  } catch (err) {
    return `无法读取日志: ${err.message}`;
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/deploy-log') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(readDeployLog());
    return;
  }

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
