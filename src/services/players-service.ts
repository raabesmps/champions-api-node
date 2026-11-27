import type { HttpResponse } from '../models/http-response-model';
import type { PlayerModel, PlayerView } from '../models/player-model';
import * as ClubsRepository from '../repositories/clubs-repository';
import * as PlayersRepository from '../repositories/players-repository';
import * as http from '../utils/http-helper';

/* SERVICE DE JOGADORES: regras de negócio e escolha do status HTTP. */

/** Junta o nome do clube ao jogador. */
async function withClub(players: PlayerModel[]): Promise<PlayerView[]> {
  const clubs = new Map((await ClubsRepository.findAllClubs()).map((c) => [c.id, c.name]));
  return players.map((p) => ({ ...p, club: clubs.get(p.clubId) ?? 'Sem clube' }));
}

export async function getPlayersService(): Promise<HttpResponse> {
  const players = await PlayersRepository.findAllPlayers();
  // Lista vazia também é 200: a consulta deu certo, só não há itens.
  return http.ok(await withClub(players));
}

export async function getPlayerByIdService(id: number): Promise<HttpResponse> {
  const player = await PlayersRepository.findPlayerById(id);
  if (!player) return http.notFound(`Jogador ${id} não encontrado.`); // na aula: 204
  const [view] = await withClub([player]);
  return http.ok(view);
}
