/** Atributos de um jogador, de 1 a 99. */
export interface StatisticsModel {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export const STATISTIC_KEYS = ['overall', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const satisfies readonly (keyof StatisticsModel)[];

export type StatisticKey = (typeof STATISTIC_KEYS)[number];

export const STATISTIC_LABELS: Record<StatisticKey, string> = {
  overall: 'Geral',
  pace: 'Velocidade',
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
  physical: 'Físico',
};
