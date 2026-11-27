import type { HttpResponse } from '../models/http-response-model';
import { POSITIONS, type PlayerModel, type PlayerView } from '../models/player-model';
import * as ClubsRepository from '../repositories/clubs-repository';
import * as PlayersRepository from '../repositories/players-repository';
import * as http from '../utils/http-helper';
import { normalize } from '../utils/text';
import { parsePosition, validateNewPlayer, validateStatisticsUpdate } from './player-validator';

/* SERVICE DE JOGADORES: regras de negócio e escolha do status HTTP. */

/** Junta o nome do clube ao jogador. */
async function withClub(players: PlayerModel[]): Promise<PlayerView[]> {
  const clubs = new Map((await ClubsRepository.findAllClubs()).map((c) => [c.id, c.name]));
  return players.map((p) => ({ ...p, club: clubs.get(p.clubId) ?? 'Sem clube' }));
}

export interface PlayerFilter {
  club?: string;
  position?: string;
  nationality?: string;
}

/** Filtros opcionais: ?club= (id ou nome), ?position= e ?nationality=, sem diferenciar acentos. */
export async function getPlayersService(filter: PlayerFilter = {}): Promise<HttpResponse> {
  let position: string | undefined;
  if (filter.position) {
    position = parsePosition(filter.position);
    if (!position) return http.badRequest(`Posição "${filter.position}" inválida. Use: ${POSITIONS.join(', ')}.`);
  }

  const players = await withClub(await PlayersRepository.findAllPlayers());
  const club = filter.club ? normalize(filter.club) : '';
  const nationality = filter.nationality ? normalize(filter.nationality) : '';

  const result = players.filter(
    (p) =>
      (!club || String(p.clubId) === club || normalize(p.club) === club) &&
      (!position || p.position === position) &&
      (!nationality || normalize(p.nationality) === nationality),
  );
  // Lista vazia também é 200: a consulta deu certo, só não há itens.
  return http.ok(result);
}

export async function getPlayerByIdService(id: number): Promise<HttpResponse> {
  const player = await PlayersRepository.findPlayerById(id);
  if (!player) return http.notFound(`Jogador ${id} não encontrado.`); // na aula: 204
  const [view] = await withClub([player]);
  return http.ok(view);
}

export async function createPlayerService(body: unknown): Promise<HttpResponse> {
  const validation = validateNewPlayer(body);
  if (!validation.ok) return http.badRequest('Dados do jogador inválidos.', validation.errors);
  const data = validation.value;

  if (!(await ClubsRepository.findClubById(data.clubId))) {
    return http.badRequest('Dados do jogador inválidos.', [`O clube ${data.clubId} não existe. Veja os clubes em /api/clubs.`]);
  }

  const players = await PlayersRepository.findAllPlayers();
  const duplicate = players.some((p) => p.clubId === data.clubId && normalize(p.name) === normalize(data.name));
  if (duplicate) return http.conflict(`${data.name} já está cadastrado nesse clube.`);

  const created = await PlayersRepository.insertPlayer(data);
  const [view] = await withClub([created]);
  return http.created(view, `/api/players/${created.id}`);
}

/**
 * Atualiza só as estatísticas enviadas.
 * (Na aula, o objeto inteiro era substituído, apagando o que não foi enviado,
 * e um id inexistente derrubava a requisição com Object.keys(undefined).)
 */
export async function updatePlayerStatisticsService(id: number, body: unknown): Promise<HttpResponse> {
  const validation = validateStatisticsUpdate(body);
  if (!validation.ok) return http.badRequest('Estatísticas inválidas.', validation.errors);

  const updated = await PlayersRepository.updatePlayerStatistics(id, validation.value);
  if (!updated) return http.notFound(`Jogador ${id} não encontrado.`);
  const [view] = await withClub([updated]);
  return http.ok(view);
}

/** 204 sem corpo quando remove; 404 quando não existe (na aula: 200 "deleted" ou 400). */
export async function deletePlayerService(id: number): Promise<HttpResponse> {
  const deleted = await PlayersRepository.deletePlayer(id);
  return deleted ? http.noContent() : http.notFound(`Jogador ${id} não encontrado.`);
}
