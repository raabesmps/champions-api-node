import { POSITIONS, type NewPlayer, type Position } from '../models/player-model';
import { STATISTIC_KEYS, type StatisticsModel } from '../models/statistics-model';
import { normalize } from '../utils/text';

/*
 * VALIDAÇÃO DO CORPO DAS REQUISIÇÕES
 * Devolve os dados limpos ou a lista de problemas, um por campo, para o cliente saber o que corrigir.
 * (Na aula, qualquer objeto não vazio era aceito, inclusive sem nome ou com estatísticas em texto.)
 */

export type Validation<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function text(body: Record<string, unknown>, field: string, label: string, errors: string[], min = 2, max = 80): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim().length < min) {
    errors.push(`"${field}" é obrigatório: ${label} com pelo menos ${min} letras.`);
    return '';
  }
  if (value.trim().length > max) errors.push(`"${field}" passa de ${max} caracteres.`);
  return value.trim().replace(/\s+/g, ' ');
}

function statistic(value: unknown, key: string, errors: string[]): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 99) {
    errors.push(`"statistics.${key}" deve ser um número inteiro de 1 a 99.`);
    return 0;
  }
  return value as number;
}

function unknownKeys(stats: Record<string, unknown>, errors: string[]) {
  const extra = Object.keys(stats).filter((k) => !(STATISTIC_KEYS as readonly string[]).includes(k));
  if (extra.length) errors.push(`Estatísticas desconhecidas: ${extra.join(', ')}. Use: ${STATISTIC_KEYS.join(', ')}.`);
}

export function parsePosition(value: unknown): Position | undefined {
  if (typeof value !== 'string') return undefined;
  return POSITIONS.find((p) => normalize(p) === normalize(value));
}

/** Corpo do POST /players: todos os campos obrigatórios. */
export function validateNewPlayer(body: unknown): Validation<NewPlayer> {
  if (!isObject(body)) return { ok: false, errors: ['Envie um objeto JSON com os dados do jogador.'] };
  const errors: string[] = [];

  const name = text(body, 'name', 'o nome do jogador', errors);
  const nationality = text(body, 'nationality', 'o país', errors, 2, 60);

  const clubId = body.clubId;
  if (!Number.isInteger(clubId) || (clubId as number) < 1) errors.push('"clubId" é obrigatório: o id numérico de um clube de /api/clubs.');

  const position = parsePosition(body.position);
  if (!position) errors.push(`"position" deve ser uma destas: ${POSITIONS.join(', ')}.`);

  const statistics = {} as StatisticsModel;
  if (!isObject(body.statistics)) {
    errors.push(`"statistics" é obrigatório: um objeto com ${STATISTIC_KEYS.join(', ')}.`);
  } else {
    unknownKeys(body.statistics, errors);
    for (const key of STATISTIC_KEYS) statistics[key] = statistic(body.statistics[key], key, errors);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { name, clubId: clubId as number, nationality, position: position!, statistics } };
}

/**
 * Corpo do PATCH /players/:id: só as estatísticas que mudam.
 * Aceita { "pace": 90 } (como na aula, o corpo é o próprio objeto de estatísticas)
 * ou { "statistics": { "pace": 90 } }.
 */
export function validateStatisticsUpdate(body: unknown): Validation<Partial<StatisticsModel>> {
  if (!isObject(body)) return { ok: false, errors: ['Envie um objeto JSON com as estatísticas a atualizar.'] };
  const stats = isObject(body.statistics) ? body.statistics : body;
  const errors: string[] = [];

  unknownKeys(stats, errors);
  const changes: Partial<StatisticsModel> = {};
  for (const key of STATISTIC_KEYS) {
    if (key in stats) changes[key] = statistic(stats[key], key, errors);
  }
  if (!errors.length && Object.keys(changes).length === 0) {
    errors.push(`Envie pelo menos uma estatística: ${STATISTIC_KEYS.join(', ')}.`);
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: changes };
}
