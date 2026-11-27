import type { StatisticsModel } from './statistics-model';

export const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campista', 'Atacante'] as const;
export type Position = (typeof POSITIONS)[number];

export interface PlayerModel {
  id: number;
  name: string;
  clubId: number;
  nationality: string;
  position: Position;
  statistics: StatisticsModel;
}

/** O que o cliente envia para cadastrar: o id é gerado pela API. */
export type NewPlayer = Omit<PlayerModel, 'id'>;

/** Como o jogador sai na resposta: com o nome do clube junto. */
export interface PlayerView extends PlayerModel {
  club: string;
}
