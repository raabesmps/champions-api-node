import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { useTempData, validPlayer } from './helpers';

const data = useTempData();
const { createApp } = await import('../src/app');

let server: Server;
let base: string;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${(server.address() as AddressInfo).port}/api`;
});

after(() => {
  server.close();
  data.cleanup();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const json = (res: Response): Promise<any> => res.json();
const send = (method: string, path: string, body?: unknown) =>
  fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('rotas de jogadores', () => {
  test('GET /api/players', async () => {
    const res = await fetch(`${base}/players`);
    assert.equal(res.status, 200);
    assert.equal((await json(res)).length, 18);
  });

  test('GET /api/players?nationality=brasil', async () => {
    assert.equal((await json(await fetch(`${base}/players?nationality=brasil`))).length, 5);
  });

  test('GET /api/players/:id → 200, 404 e 400', async () => {
    assert.equal((await json(await fetch(`${base}/players/4`))).name, 'Lamine Yamal');
    assert.equal((await fetch(`${base}/players/999`)).status, 404);
    assert.equal((await fetch(`${base}/players/abc`)).status, 400);
  });

  test('POST → 201 com Location; PATCH → 200; DELETE → 204 sem corpo', async () => {
    const created = await send('POST', '/players', validPlayer());
    assert.equal(created.status, 201);
    const player = await json(created);
    assert.equal(created.headers.get('location'), `/api/players/${player.id}`);

    const patched = await send('PATCH', `/players/${player.id}`, { overall: 87 });
    assert.equal((await json(patched)).statistics.overall, 87);

    const deleted = await send('DELETE', `/players/${player.id}`);
    assert.equal(deleted.status, 204);
    assert.equal(await deleted.text(), '');
  });

  test('POST inválido → 400 com detalhes', async () => {
    const res = await send('POST', '/players', { name: 'Sem dados' });
    assert.equal(res.status, 400);
    assert.ok((await json(res)).details.length >= 3);
  });

  test('JSON malformado → 400 claro', async () => {
    const res = await send('POST', '/players', '{nome');
    assert.equal(res.status, 400);
    assert.match((await json(res)).message, /não é um JSON válido/);
  });

  test('GET /api/players/compare não é confundido com um id', async () => {
    const res = await fetch(`${base}/players/compare?ids=1,7`);
    assert.equal(res.status, 200);
    assert.match((await json(res)).verdict, /vence o duelo/);
  });
});

describe('rotas de clubes', () => {
  test('GET /api/clubs lê o JSON', async () => {
    assert.equal((await json(await fetch(`${base}/clubs`))).length, 36);
  });

  test('POST e DELETE /api/clubs', async () => {
    const created = await send('POST', '/clubs', { name: 'Palmeiras', country: 'Brasil' });
    assert.equal(created.status, 201);
    const { id } = await json(created);
    assert.equal((await send('DELETE', `/clubs/${id}`)).status, 204);
    assert.equal((await send('DELETE', '/clubs/1')).status, 409);
  });
});

describe('infraestrutura', () => {
  test('CORS aparece nas rotas da /api (na aula, o cors() vinha depois das rotas)', async () => {
    const res = await fetch(`${base}/players`, { headers: { Origin: 'https://exemplo.com' } });
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  test('rota inexistente → 404 em JSON', async () => {
    const res = await fetch(`${base}/estadios`);
    assert.equal(res.status, 404);
    assert.match((await json(res)).message, /não encontrada/);
  });

  test('GET /api/health', async () => {
    assert.equal((await json(await fetch(`${base}/health`))).status, 'ok');
  });
});
