export interface ClubModel {
  id: number;
  name: string;
  country: string;
}

export type NewClub = Omit<ClubModel, 'id'>;
