import type { CardDef } from '../data/schemas.ts';

export interface TeamSlot {
  card: CardDef;
  x: number;
  y: number;
}

export interface Team {
  name: string;
  formation: TeamSlot[];
}
