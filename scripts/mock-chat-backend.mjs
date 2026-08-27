import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8080);

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/ready')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/chat') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let parsed;
      try {
        parsed = JSON.parse(body || '{}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid JSON' }));
        return;
      }
      const message = typeof parsed.message === 'string' ? parsed.message : '';
      const sessionId = typeof parsed.sessionId === 'string' && parsed.sessionId
        ? parsed.sessionId
        : 'mock-session-1';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ response: `Echo: ${message}`, sessionId }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`[mock-chat-backend] listening on http://localhost:${PORT}`);
});
