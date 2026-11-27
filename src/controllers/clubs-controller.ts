import type { Request, Response } from 'express';
import * as service from '../services/clubs-service';
import { readId, send } from './send';

/* CONTROLLER DE CLUBES: lê a requisição, chama o service e devolve a resposta. */

const queryText = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined);

export async function getClubs(req: Request, res: Response) {
  send(res, await service.getClubsService({ country: queryText(req.query.country) }));
}

export async function getClubById(req: Request, res: Response) {
  const id = readId(req, res);
  if (id === null) return;
  send(res, await service.getClubByIdService(id));
}

export async function postClub(req: Request, res: Response) {
  send(res, await service.createClubService(req.body));
}

export async function deleteClub(req: Request, res: Response) {
  const id = readId(req, res);
  if (id === null) return;
  send(res, await service.deleteClubService(id));
}
