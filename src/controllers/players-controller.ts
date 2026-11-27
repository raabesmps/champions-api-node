import type { Request, Response } from 'express';
import * as service from '../services/players-service';
import { readId, send } from './send';

/* CONTROLLER DE JOGADORES: lê a requisição, chama o service e devolve a resposta. */

export async function getPlayers(_req: Request, res: Response) {
  send(res, await service.getPlayersService());
}

export async function getPlayerById(req: Request, res: Response) {
  const id = readId(req, res);
  if (id === null) return;
  send(res, await service.getPlayerByIdService(id));
}

export async function postPlayer(req: Request, res: Response) {
  send(res, await service.createPlayerService(req.body));
}

export async function updatePlayer(req: Request, res: Response) {
  const id = readId(req, res);
  if (id === null) return;
  send(res, await service.updatePlayerStatisticsService(id, req.body));
}

export async function deletePlayer(req: Request, res: Response) {
  const id = readId(req, res);
  if (id === null) return;
  send(res, await service.deletePlayerService(id));
}
