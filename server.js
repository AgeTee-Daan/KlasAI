// KlasAI-server: serveert de interface en geeft chatberichten door aan Ollama.
// Start met: node server.js  (Node 18 of nieuwer, geen extra pakketten nodig)
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const CHAT_MODEL = process.env.CHAT_MODEL || 'llama3.1:8b';
const ROOT = path.join(__dirname, 'prototype');

const MAX_BODY = 1024 * 1024;
const MAX_MESSAGES = 20;
const MAX_CHARS = 8000;

// De systeeminstructie staat op de server, zodat leerlingen hem niet kunnen aanpassen.
const SYSTEM_PROMPT = [
  'Je bent KlasAI, een vriendelijke en geduldige leerhulp voor leerlingen van een Nederlandse middelbare school (12 tot 18 jaar).',
  'Antwoord in het Nederlands, tenzij de leerling in een andere taal schrijft of om een andere taal vraagt.',
  'Leg dingen uit in duidelijke, korte zinnen en gebruik voorbeelden die passen bij de leeftijd van de leerling.',
  'Help de leerling zelf te leren: geef bij huiswerk liever uitleg, hints en tussenstappen dan alleen het eindantwoord.',
  'Sluit waar het past af met een korte vervolgvraag om te checken of de leerling het snapt.',
  'Blijf respectvol en veilig. Ga niet in op ongepaste, gevaarlijke of kwetsende verzoeken, en verwijs bij persoonlijke problemen vriendelijk naar een mentor, docent of vertrouwenspersoon.',
  'Gebruik eenvoudige opmaak: **vet** voor kernwoorden, regels die beginnen met "- " voor lijstjes, en `code` voor formules of code.'
].join(' ');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('te groot')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function ollamaModels() {
  const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error(`Ollama gaf status ${r.status}`);
  const j = await r.json();
  return (j.models || []).map(m => m.name);
}
const hasModel = (names, model) => names.includes(model) || (!model.includes(':') && names.includes(model + ':latest'));

async function handleStatus(res) {
  try {
    const modellen = await ollamaModels();
    sendJson(res, 200, { ollama: true, model: CHAT_MODEL, modelAanwezig: hasModel(modellen, CHAT_MODEL), modellen });
  } catch (e) {
    sendJson(res, 200, { ollama: false, model: CHAT_MODEL, modelAanwezig: false, modellen: [] });
  }
}

async function handleChat(req, res) {
  let body;
  try { body = JSON.parse(await readBody(req)); } catch (e) { return sendJson(res, 400, { fout: 'Ongeldig verzoek.' }); }

  const messages = Array.isArray(body && body.messages) ? body.messages : [];
  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') return sendJson(res, 400, { fout: 'Er is geen vraag meegestuurd.' });

  const ac = new AbortController();
  res.on('close', () => { if (!res.writableEnded) ac.abort(); });

  let upstream;
  try {
    upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: CHAT_MODEL, stream: true, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...clean] }),
      signal: ac.signal
    });
  } catch (e) {
    if (ac.signal.aborted) return;
    return sendJson(res, 502, { fout: 'Ollama is niet bereikbaar. Start Ollama op de server en probeer het opnieuw.' });
  }

  if (!upstream.ok) {
    const tekst = await upstream.text().catch(() => '');
    if (upstream.status === 404) return sendJson(res, 502, { fout: `Het model "${CHAT_MODEL}" is niet geïnstalleerd. Voer op de server uit: ollama pull ${CHAT_MODEL}` });
    return sendJson(res, 502, { fout: `Ollama gaf een fout (${upstream.status}). ${tekst.slice(0, 200)}`.trim() });
  }

  // Ollama stuurt regels met JSON (NDJSON); die geven we ongewijzigd door aan de browser.
  res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  try {
    for await (const chunk of upstream.body) res.write(chunk);
  } catch (e) {
    if (!ac.signal.aborted) res.write(JSON.stringify({ error: 'De verbinding met Ollama werd onderbroken.' }) + '\n');
  }
  res.end();
}

function serveStatic(req, res) {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Niet gevonden'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pad = req.url.split('?')[0];
  if (pad === '/api/status' && req.method === 'GET') return handleStatus(res);
  if (pad === '/api/chat' && req.method === 'POST') return handleChat(req, res).catch(() => { if (!res.headersSent) sendJson(res, 500, { fout: 'Er ging iets mis op de server.' }); else res.end(); });
  if (pad.startsWith('/api/')) return sendJson(res, 404, { fout: 'Onbekend adres.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`KlasAI draait op http://localhost:${PORT}`);
  console.log(`Ollama: ${OLLAMA_URL}  ·  chatmodel: ${CHAT_MODEL}`);
});
