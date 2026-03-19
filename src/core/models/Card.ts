import type { CardDef, Position, StarRating } from '../data/schemas.ts';

export class Card {
  readonly id: string;
  readonly name: string;
  readonly position: Position;
  readonly star: StarRating;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly technique: number;
  readonly skill1: string;
  readonly skill2: string;
  readonly artAsset: string;
  readonly description: string;

  constructor(def: CardDef) {
    this.id = def.id;
    this.name = def.name;
    this.position = def.position;
    this.star = def.star;
    this.attack = def.attack;
    this.defense = def.defense;
    this.speed = def.speed;
    this.technique = def.technique;
    this.skill1 = def.skill1;
    this.skill2 = def.skill2;
    this.artAsset = def.artAsset;
    this.description = def.description;
  }

  get overall(): number {
    return Math.round((this.attack + this.defense + this.speed + this.technique) / 4);
  }
}
