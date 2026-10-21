// Grand Line Post — optional multiplayer relay + static server. Zero dependencies.
//
//   npm run build && npm run serve        -> http://localhost:8787 (game + multiplayer)
//   PORT=9000 node server/server.mjs      -> custom port
//
// Serves dist/ and relays tiny presence/emote messages between players on /mp.
// No accounts, no storage, no personal data: messages live only in memory.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 8787);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const MAX_CLIENTS = 200;
const MAX_FRAME = 2048;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };

// ---------------------------------------------------------------- static files
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  let body = fs.readFileSync(file);
  if (file.endsWith('index.html')) body = Buffer.from(body.toString('utf8').replace('<head>', '<head>\n    <meta name="mp" content="1" />'));
  const entry = { body, gz: zlib.gzipSync(body, { level: 9 }), br: zlib.brotliCompressSync(body), type: TYPES[path.extname(file)] || 'application/octet-stream' };
  cache.set(file, entry);
  return entry;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('Not found. Did you run "npm run build" first?');
  }
  const e = load(file);
  const enc = String(req.headers['accept-encoding'] || '');
  const headers = { 'content-type': e.type, 'cache-control': rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', vary: 'accept-encoding' };
  if (enc.includes('br')) res.writeHead(200, { ...headers, 'content-encoding': 'br' }).end(e.br);
  else if (enc.includes('gzip')) res.writeHead(200, { ...headers, 'content-encoding': 'gzip' }).end(e.gz);
  else res.writeHead(200, headers).end(e.body);
});

// ---------------------------------------------------------------- websocket relay
const clients = new Set();

function frame(text) {
  const data = Buffer.from(text);
  const len = data.length;
  const head = len < 126 ? Buffer.from([0x81, len]) : Buffer.from([0x81, 126, len >> 8, len & 255]);
  return Buffer.concat([head, data]);
}

function send(c, text) {
  if (!c.dead) c.sock.write(frame(text));
}

function broadcast(from, text) {
  for (const c of clients) if (c !== from) send(c, text);
}

function close(c) {
  if (c.dead) return;
  c.dead = true;
  clients.delete(c);
  try { c.sock.end(Buffer.from([0x88, 0])); } catch { /* ignore */ }
  broadcast(c, JSON.stringify({ t: 'bye', id: c.id }));
}

function onMessage(c, text) {
  const now = Date.now();
  if (now - c.windowStart > 1000) { c.windowStart = now; c.count = 0; }
  if (++c.count > 20) return; // rate limit: 20 msgs/s
  let m;
  try { m = JSON.parse(text); } catch { return; }
  if (!m || (m.t !== 's' && m.t !== 'e' && m.t !== 'bye')) return;
  m.id = c.id; // never trust client ids
  if (m.t === 's') {
    if (!Array.isArray(m.d) || m.d.length !== 3 || !Array.isArray(m.f) || m.f.length !== 3) return;
    m.d = m.d.map(Number); m.f = m.f.map(Number);
    m.h = Number(m.h) || 0; m.v = Number(m.v) || 0;
    m.o = String(m.o || '').slice(0, 80);
    m.i = String(m.i || '').slice(0, 24);
  }
  if (m.t === 'e') m.e = String(m.e || '').slice(0, 24);
  broadcast(c, JSON.stringify(m));
}

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (new URL(req.url || '/', 'http://x').pathname !== '/mp' || !key || clients.size >= MAX_CLIENTS) {
    sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return;
  }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  sock.setNoDelay(true);
  const c = { id: crypto.randomBytes(4).toString('hex'), sock, buf: Buffer.alloc(0), dead: false, alive: true, windowStart: 0, count: 0 };
  clients.add(c);
  sock.on('data', (chunk) => {
    c.buf = Buffer.concat([c.buf, chunk]);
    while (c.buf.length >= 2) {
      const b0 = c.buf[0];
      const b1 = c.buf[1];
      const fin = b0 & 0x80;
      const op = b0 & 0x0f;
      const masked = b1 & 0x80;
      let len = b1 & 0x7f;
      let off = 2;
      if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) return close(c); // we never accept huge frames
      if (!masked || len > MAX_FRAME || !fin) return close(c);
      if (c.buf.length < off + 4 + len) return;
      const mask = c.buf.subarray(off, off + 4);
      const data = Buffer.from(c.buf.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
      c.buf = c.buf.subarray(off + 4 + len);
      if (op === 0x1) onMessage(c, data.toString('utf8'));
      else if (op === 0x8) return close(c);
      else if (op === 0x9) c.sock.write(Buffer.concat([Buffer.from([0x8a, data.length]), data]));
      else if (op === 0xa) c.alive = true;
    }
  });
  sock.on('close', () => close(c));
  sock.on('error', () => close(c));
});

setInterval(() => {
  for (const c of clients) {
    if (!c.alive) { close(c); continue; }
    c.alive = false;
    try { c.sock.write(Buffer.from([0x89, 0])); } catch { close(c); }
  }
}, 20000);

server.listen(PORT, () => console.log(`Grand Line Post: http://localhost:${PORT}  (multiplayer relay on /mp, serving ${ROOT})`));
