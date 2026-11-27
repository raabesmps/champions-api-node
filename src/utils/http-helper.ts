import type { HttpResponse } from '../models/http-response-model';

/*
 * Atalhos para montar respostas com o status certo.
 * (Na aula eram funções async sem nada assíncrono, e o 404 não existia: "não encontrado" virava 204 ou 400.)
 */

export const ok = <T>(body: T): HttpResponse<T> => ({ statusCode: 200, body });

/** 201 com o recurso criado e o cabeçalho Location apontando para ele. */
export const created = <T>(body: T, location: string): HttpResponse<T> => ({ statusCode: 201, body, headers: { Location: location } });

/** 204: deu certo e não há o que devolver (ex.: depois de um DELETE). Nunca tem corpo. */
export const noContent = (): HttpResponse<never> => ({ statusCode: 204 });

export const badRequest = (message: string, details?: string[]): HttpResponse<{ message: string; details?: string[] }> => ({
  statusCode: 400,
  body: details?.length ? { message, details } : { message },
});

export const notFound = (message: string): HttpResponse<{ message: string }> => ({ statusCode: 404, body: { message } });

export const conflict = (message: string): HttpResponse<{ message: string }> => ({ statusCode: 409, body: { message } });
