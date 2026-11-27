import type { Request, Response } from 'express';
import type { HttpResponse } from '../models/http-response-model';
import { badRequest } from '../utils/http-helper';

/** Escreve a resposta do service no Express. 204 sai sem corpo, como manda o HTTP. */
export function send(res: Response, response: HttpResponse) {
  if (response.headers) res.set(response.headers);
  if (response.statusCode === 204 || response.body === undefined) {
    res.status(response.statusCode).end();
    return;
  }
  res.status(response.statusCode).json(response.body);
}

/**
 * Lê o :id da URL. Devolve o número, ou envia 400 e devolve null.
 * (Na aula, parseInt("abc") virava NaN e seguia adiante.)
 */
export function readId(req: Request, res: Response): number | null {
  const raw = String(req.params.id);
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || !Number.isSafeInteger(Number(raw))) {
    send(res, badRequest(`O id "${raw}" é inválido: use um número inteiro positivo.`));
    return null;
  }
  return Number(raw);
}
