import type { ClubModel, NewClub } from '../models/club-model';
import { createJsonStore } from './json-store';

/* REPOSITÓRIO DE CLUBES: só lê e grava. Regras de negócio ficam no service. */

const store = createJsonStore<ClubModel>('clubs');

export const findAllClubs = (): Promise<ClubModel[]> => store.read();

export const findClubById = async (id: number): Promise<ClubModel | undefined> => (await store.read()).find((c) => c.id === id);

export const insertClub = (club: NewClub): Promise<ClubModel> =>
  store.update((clubs) => {
    const created = { id: Math.max(0, ...clubs.map((c) => c.id)) + 1, ...club };
    clubs.push(created);
    return created;
  });

export const deleteClub = (id: number): Promise<boolean> =>
  store.update((clubs) => {
    const index = clubs.findIndex((c) => c.id === id);
    if (index === -1) return false;
    clubs.splice(index, 1);
    return true;
  });
