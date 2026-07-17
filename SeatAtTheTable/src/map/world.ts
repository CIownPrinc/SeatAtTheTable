import type { Point } from '../config/types';

export interface VerticalRoad {
  x: number;
  w: number;
  name: string;
}

export interface HorizontalRoad {
  y: number;
  w: number;
  name: string;
}

export interface Landmark {
  id: string;
  name: string;
  district: string;
  x: number;
  y: number;
}

export const VIEW_W = 760;
export const VIEW_H = 440;
export const WORLD_W = 5500;
export const WORLD_H = 1200;
export const DISTRICT_W = 1500;

export const DISTRICT_OFFSETS: Record<string, number> = {
  devlin: 0,
  westside: 2000,
  hub: 4000,
};

export const districtSeeds: Record<string, number> = {
  devlin: 1001,
  westside: 2002,
  hub: 3003,
};

export const spawnPoints: Record<string, Point> = {
  devlin: { x: 700, y: 600 },
  westside: { x: 2700, y: 600 },
  hub: { x: 4700, y: 600 },
};

export const ventureDistricts = ['devlin', 'devlin', 'devlin', 'devlin', 'devlin', 'westside', 'westside', 'westside', 'westside', 'hub', 'hub', 'hub'];

export const ventureLots: Record<string, Point[]> = {
  devlin: [{ x: 120, y: 130 }, { x: 485, y: 130 }, { x: 915, y: 130 }, { x: 1330, y: 130 }, { x: 120, y: 450 }],
  westside: [{ x: 2120, y: 130 }, { x: 2485, y: 130 }, { x: 2915, y: 130 }, { x: 3330, y: 130 }],
  hub: [{ x: 4120, y: 130 }, { x: 4485, y: 130 }, { x: 4915, y: 130 }, { x: 5330, y: 130 }],
};

export const namedBuildingLots: Record<string, Point> = {
  bankHome: { x: 485, y: 450 },
  cardealer: { x: 915, y: 450 },
  realty: { x: 1330, y: 450 },
  patel: { x: 485, y: 750 },
  pawn: { x: 915, y: 750 },
  herbalist: { x: 1330, y: 750 },
  bar: { x: 485, y: 1030 },
  chopshop: { x: 2120, y: 450 },
  liquor: { x: 3330, y: 450 },
  jewelers: { x: 4485, y: 450 },
  marlowe: { x: 4915, y: 450 },
  cityhall: { x: 5330, y: 450 },
  heistTarget: { x: 4120, y: 750 },
};

export const landmarks: Landmark[] = [
  { id: 'devlinHall', name: 'DEVLIN HALL', district: 'devlin', x: 125, y: 820 },
  { id: 'ciceroWorks', name: 'CICERO WORKS', district: 'westside', x: 2125, y: 850 },
];

export const roadNetwork: { vertical: VerticalRoad[]; horizontal: HorizontalRoad[] } = {
  vertical: [
    { x: 270, w: 74, name: 'Rockwell Avenue' },
    { x: 700, w: 74, name: 'Devlin Street' },
    { x: 1130, w: 74, name: 'Ashland Row' },
    { x: 2270, w: 74, name: 'Cicero Avenue' },
    { x: 2700, w: 74, name: 'Pulaski Road' },
    { x: 3130, w: 74, name: 'Canal Yard Drive' },
    { x: 4270, w: 74, name: 'LaSalle Street' },
    { x: 4700, w: 74, name: 'Wabash Avenue' },
    { x: 5130, w: 74, name: 'Lakefront Drive' },
  ],
  horizontal: [
    { y: 300, w: 74, name: 'Grand Avenue' },
    { y: 600, w: 74, name: 'Roosevelt Road' },
    { y: 900, w: 74, name: 'Cermak Road' },
  ],
};
