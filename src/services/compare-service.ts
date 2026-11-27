import type { HttpResponse } from '../models/http-response-model';
import { STATISTIC_KEYS, STATISTIC_LABELS, type StatisticKey } from '../models/statistics-model';
import * as ClubsRepository from '../repositories/clubs-repository';
import * as PlayersRepository from '../repositories/players-repository';
import * as http from '../utils/http-helper';

/*
 * DUELO (a novidade do projeto)
 * Compara de 2 a 5 jogadores atributo por atributo: quem tem o maior valor vence o atributo
 * (empate não conta ponto para ninguém). No fim, o placar diz quem venceu mais atributos.
 */

export const MIN_DUEL = 2;
export const MAX_DUEL = 5;

interface AttributeDuel {
  attribute: StatisticKey;
  label: string;
  values: Record<string, number>;
  /** Id do vencedor do atributo, ou null em caso de empate na liderança. */
  winner: number | null;
}

/** Lê "1,7" ou "1, 7" em [1, 7]. Devolve null se o formato estiver errado. */
export function parseIds(raw: unknown): number[] | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.some((p) => !/^\d+$/.test(p) || Number(p) < 1)) return null;
  return [...new Set(parts.map(Number))];
}

export async function comparePlayersService(rawIds: unknown): Promise<HttpResponse> {
  const ids = parseIds(rawIds);
  if (!ids) return http.badRequest('Informe os jogadores em ?ids=, separados por vírgula. Exemplo: /api/players/compare?ids=1,7');
  if (ids.length < MIN_DUEL || ids.length > MAX_DUEL) {
    return http.badRequest(`Um duelo precisa de ${MIN_DUEL} a ${MAX_DUEL} jogadores diferentes (você enviou ${ids.length}).`);
  }

  const all = await PlayersRepository.findAllPlayers();
  const players = ids.map((id) => all.find((p) => p.id === id));
  const missing = ids.filter((_, i) => !players[i]);
  if (missing.length) return http.notFound(`Jogador${missing.length > 1 ? 'es' : ''} não encontrado${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);

  const clubs = new Map((await ClubsRepository.findAllClubs()).map((c) => [c.id, c.name]));
  const contenders = players.map((p) => p!);

  const attributes: AttributeDuel[] = STATISTIC_KEYS.map((key) => {
    const best = Math.max(...contenders.map((p) => p.statistics[key]));
    const leaders = contenders.filter((p) => p.statistics[key] === best);
    return {
      attribute: key,
      label: STATISTIC_LABELS[key],
      values: Object.fromEntries(contenders.map((p) => [String(p.id), p.statistics[key]])),
      winner: leaders.length === 1 ? leaders[0]!.id : null,
    };
  });

  const score = contenders
    .map((p) => ({ id: p.id, name: p.name, wins: attributes.filter((a) => a.winner === p.id).length }))
    .sort((a, b) => b.wins - a.wins);

  const [first, second] = score;
  const verdict =
    first!.wins === second!.wins
      ? `Empate: ${score.filter((s) => s.wins === first!.wins).map((s) => s.name).join(' e ')} venceram ${first!.wins} atributos cada.`
      : `${first!.name} vence o duelo com ${first!.wins} de ${STATISTIC_KEYS.length} atributos.`;

  return http.ok({
    players: contenders.map((p) => ({ id: p.id, name: p.name, club: clubs.get(p.clubId) ?? 'Sem clube', position: p.position })),
    attributes,
    score,
    verdict,
  });
}
