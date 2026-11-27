import type { NewPlayer, PlayerModel } from '../models/player-model';
import type { StatisticsModel } from '../models/statistics-model';
import { createJsonStore } from './json-store';

/* REPOSITÓRIO DE JOGADORES: só lê e grava. Regras de negócio ficam no service. */

const store = createJsonStore<PlayerModel>('players');

export const findAllPlayers = (): Promise<PlayerModel[]> => store.read();

export const findPlayerById = async (id: number): Promise<PlayerModel | undefined> => (await store.read()).find((p) => p.id === id);

/** O id é gerado aqui (na aula vinha do cliente e podia repetir). */
export const insertPlayer = (player: NewPlayer): Promise<PlayerModel> =>
  store.update((players) => {
    const created = { id: Math.max(0, ...players.map((p) => p.id)) + 1, ...player };
    players.push(created);
    return created;
  });

export const deletePlayer = (id: number): Promise<boolean> =>
  store.update((players) => {
    const index = players.findIndex((p) => p.id === id);
    if (index === -1) return false;
    players.splice(index, 1);
    return true;
  });

/** Atualiza só as estatísticas enviadas, mantendo as outras. Devolve undefined se o jogador não existe. */
export const updatePlayerStatistics = (id: number, changes: Partial<StatisticsModel>): Promise<PlayerModel | undefined> =>
  store.update((players) => {
    const player = players.find((p) => p.id === id);
    if (!player) return undefined;
    player.statistics = { ...player.statistics, ...changes };
    return player;
  });

export const countPlayersByClub = async (clubId: number): Promise<number> =>
  (await store.read()).filter((p) => p.clubId === clubId).length;
