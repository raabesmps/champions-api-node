import type { HttpResponse } from '../models/http-response-model';
import * as ClubsRepository from '../repositories/clubs-repository';
import * as PlayersRepository from '../repositories/players-repository';
import * as http from '../utils/http-helper';
import { normalize } from '../utils/text';

/* SERVICE DE CLUBES: regras de negócio e escolha do status HTTP. */

export interface ClubFilter {
  country?: string;
}

export async function getClubsService(filter: ClubFilter = {}): Promise<HttpResponse> {
  const country = filter.country ? normalize(filter.country) : '';
  const clubs = await ClubsRepository.findAllClubs();
  return http.ok(clubs.filter((c) => !country || normalize(c.country) === country));
}

export async function getClubByIdService(id: number): Promise<HttpResponse> {
  const club = await ClubsRepository.findClubById(id);
  if (!club) return http.notFound(`Clube ${id} não encontrado.`);
  const players = (await PlayersRepository.findAllPlayers()).filter((p) => p.clubId === id);
  return http.ok({ ...club, players: players.map(({ id: playerId, name, position }) => ({ id: playerId, name, position })) });
}

export async function createClubService(body: unknown): Promise<HttpResponse> {
  const data = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const errors: string[] = [];
  const name = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
  const country = typeof data.country === 'string' ? data.country.trim().replace(/\s+/g, ' ') : '';
  if (name.length < 2 || name.length > 80) errors.push('"name" é obrigatório: o nome do clube, de 2 a 80 caracteres.');
  if (country.length < 2 || country.length > 60) errors.push('"country" é obrigatório: o país do clube, de 2 a 60 caracteres.');
  if (errors.length) return http.badRequest('Dados do clube inválidos.', errors);

  const clubs = await ClubsRepository.findAllClubs();
  if (clubs.some((c) => normalize(c.name) === normalize(name))) return http.conflict(`O clube ${name} já está cadastrado.`);

  const created = await ClubsRepository.insertClub({ name, country });
  return http.created(created, `/api/clubs/${created.id}`);
}

/** Não remove clube com jogadores: eles ficariam apontando para um clube que não existe. */
export async function deleteClubService(id: number): Promise<HttpResponse> {
  if (!(await ClubsRepository.findClubById(id))) return http.notFound(`Clube ${id} não encontrado.`);
  const players = await PlayersRepository.countPlayersByClub(id);
  if (players > 0) {
    return http.conflict(`O clube ${id} tem ${players} jogador${players === 1 ? '' : 'es'}. Remova ou transfira antes de apagar o clube.`);
  }
  await ClubsRepository.deleteClub(id);
  return http.noContent();
}
