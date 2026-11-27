import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { useTempData, validPlayer } from './helpers';

const data = useTempData();
after(data.cleanup);

const players = await import('../src/services/players-service');
const clubs = await import('../src/services/clubs-service');
const { comparePlayersService, parseIds } = await import('../src/services/compare-service');
const { validateNewPlayer, validateStatisticsUpdate } = await import('../src/services/player-validator');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

describe('validação', () => {
  test('aceita um jogador completo e normaliza a posição', () => {
    const result = validateNewPlayer(validPlayer({ position: 'ATACANTE', name: '  Rodrygo   Goes ' }));
    assert.ok(result.ok);
    assert.equal(result.value.position, 'Atacante');
    assert.equal(result.value.name, 'Rodrygo Goes');
  });

  test('lista um erro por campo faltando ou inválido', () => {
    const result = validateNewPlayer({ name: 'X', statistics: { overall: 'alto' } });
    assert.equal(result.ok, false);
    const errors = (result as Any).errors.join('\n');
    for (const field of ['name', 'nationality', 'clubId', 'position', 'statistics.overall', 'statistics.pace']) {
      assert.match(errors, new RegExp(field.replace('.', '\\.')), field);
    }
  });

  test('estatísticas fora de 1 a 99 ou desconhecidas são recusadas', () => {
    const result = validateStatisticsUpdate({ pace: 120, speed: 3 });
    assert.equal(result.ok, false);
    assert.match((result as Any).errors.join(), /speed/);
    assert.match((result as Any).errors.join(), /pace/);
  });

  test('atualização aceita o corpo direto ou dentro de "statistics"', () => {
    assert.deepEqual(validateStatisticsUpdate({ pace: 90 }), { ok: true, value: { pace: 90 } });
    assert.deepEqual(validateStatisticsUpdate({ statistics: { pace: 90 } }), { ok: true, value: { pace: 90 } });
    assert.equal(validateStatisticsUpdate({}).ok, false);
  });
});

describe('jogadores', () => {
  test('lista com o nome do clube', async () => {
    const res = await players.getPlayersService();
    assert.equal(res.statusCode, 200);
    assert.equal((res.body as Any).length, 18);
    assert.equal((res.body as Any)[0].club, 'Real Madrid');
  });

  test('filtra por clube (id ou nome), posição e nacionalidade', async () => {
    const names = async (filter: object) => ((await players.getPlayersService(filter)).body as Any).map((p: Any) => p.name);
    assert.deepEqual(await names({ club: 'liverpool' }), ['Mohamed Salah', 'Alisson', 'Virgil van Dijk']);
    assert.deepEqual(await names({ club: '6' }), ['Mohamed Salah', 'Alisson', 'Virgil van Dijk']);
    assert.deepEqual(await names({ position: 'goleiro' }), ['Alisson']);
    assert.equal((await names({ nationality: 'Brasil', position: 'Zagueiro' })).length, 2);
    assert.equal((await players.getPlayersService({ position: 'ponta' })).statusCode, 400);
  });

  test('jogador inexistente → 404 (na aula: 204)', async () => {
    assert.equal((await players.getPlayerByIdService(999)).statusCode, 404);
  });

  test('cadastro gera o id, devolve 201 com Location e grava no arquivo', async () => {
    const res = await players.createPlayerService(validPlayer({ id: 1 })); // id enviado é ignorado
    assert.equal(res.statusCode, 201);
    assert.equal((res.body as Any).id, 19);
    assert.equal(res.headers?.Location, '/api/players/19');
    const saved = JSON.parse(await readFile(join(data.dir, 'players.json'), 'utf-8'));
    assert.ok(saved.some((p: Any) => p.name === 'Rodrygo'));
  });

  test('cadastro duplicado no mesmo clube → 409; clube inexistente → 400', async () => {
    assert.equal((await players.createPlayerService(validPlayer({ name: 'rodrygo' }))).statusCode, 409);
    assert.equal((await players.createPlayerService(validPlayer({ name: 'Outro', clubId: 999 }))).statusCode, 400);
  });

  test('atualização parcial mantém as outras estatísticas', async () => {
    const res = await players.updatePlayerStatisticsService(7, { pace: 88 });
    assert.equal(res.statusCode, 200);
    assert.deepEqual((res.body as Any).statistics, { overall: 90, pace: 88, shooting: 93, passing: 70, dribbling: 79, defending: 45, physical: 88 });
  });

  test('atualizar jogador inexistente → 404 (na aula derrubava a requisição)', async () => {
    assert.equal((await players.updatePlayerStatisticsService(999, { pace: 80 })).statusCode, 404);
  });

  test('remoção → 204 e depois 404', async () => {
    assert.equal((await players.deletePlayerService(19)).statusCode, 204);
    assert.equal((await players.deletePlayerService(19)).statusCode, 404);
  });

  test('cadastros simultâneos recebem ids diferentes', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => players.createPlayerService(validPlayer({ name: `Jogador ${i}`, clubId: 2 }))),
    );
    const ids = results.map((r) => (r.body as Any).id);
    assert.equal(new Set(ids).size, 10);
  });
});

describe('clubes', () => {
  test('lista os 36 clubes e filtra por país', async () => {
    assert.equal(((await clubs.getClubsService()).body as Any).length, 36);
    assert.deepEqual(((await clubs.getClubsService({ country: 'portugal' })).body as Any).map((c: Any) => c.name), ['Benfica', 'Sporting']);
  });

  test('detalhe traz os jogadores do clube', async () => {
    const res = await clubs.getClubByIdService(20);
    assert.deepEqual((res.body as Any).players.map((p: Any) => p.name), ['Ousmane Dembélé', 'Marquinhos', 'Achraf Hakimi']);
  });

  test('cadastro, duplicado e remoção', async () => {
    const created = await clubs.createClubService({ name: 'Flamengo', country: 'Brasil' });
    assert.equal(created.statusCode, 201);
    assert.equal((await clubs.createClubService({ name: 'FLAMENGO', country: 'Brasil' })).statusCode, 409);
    assert.equal((await clubs.deleteClubService((created.body as Any).id)).statusCode, 204);
  });

  test('não apaga clube com jogadores', async () => {
    const res = await clubs.deleteClubService(20);
    assert.equal(res.statusCode, 409);
    assert.match((res.body as Any).message, /3 jogadores/);
  });
});

describe('duelo', () => {
  test('lê a lista de ids', () => {
    assert.deepEqual(parseIds('1, 7,1'), [1, 7]);
    assert.equal(parseIds('a,b'), null);
    assert.equal(parseIds(undefined), null);
  });

  test('Mbappé x Haaland: vence quem leva mais atributos', async () => {
    const res = await comparePlayersService('1,7');
    const body = res.body as Any;
    assert.equal(res.statusCode, 200);
    assert.equal(body.attributes.find((a: Any) => a.attribute === 'pace').winner, 1);
    assert.equal(body.attributes.find((a: Any) => a.attribute === 'physical').winner, 7);
    assert.deepEqual(body.score.map((s: Any) => s.wins), [4, 3]);
    assert.match(body.verdict, /Kylian Mbappé vence/);
  });

  test('empate na liderança de um atributo não dá ponto', async () => {
    // Salah (8) e Dembélé (15) têm os dois 84 de passe.
    const body = (await comparePlayersService('8,15')).body as Any;
    const passing = body.attributes.find((a: Any) => a.attribute === 'passing');
    assert.equal(passing.values['8'], passing.values['15']);
    assert.equal(passing.winner, null);
  });

  test('erros: poucos, muitos ou inexistentes', async () => {
    assert.equal((await comparePlayersService('1')).statusCode, 400);
    assert.equal((await comparePlayersService('1,2,3,4,5,6')).statusCode, 400);
    assert.equal((await comparePlayersService('1,999')).statusCode, 404);
  });
});
