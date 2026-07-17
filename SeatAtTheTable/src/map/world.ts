import type { Point } from '../config/types';

export interface VerticalRoad {
  x: number;
  w: number;
}

export interface HorizontalRoad {
  y: number;
  w: number;
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

export const landmarks: Landmark[] = [
  { id: 'devlinHall', name: 'DEVLIN HALL', district: 'devlin', x: 125, y: 820 },
  { id: 'ciceroWorks', name: 'CICERO WORKS', district: 'westside', x: 2125, y: 850 },
];

export const roadNetwork: { vertical: VerticalRoad[]; horizontal: HorizontalRoad[] } = {
  vertical: [
    { x: 270, w: 74 },
    { x: 700, w: 74 },
    { x: 1130, w: 74 },
    { x: 2270, w: 74 },
    { x: 2700, w: 74 },
    { x: 3130, w: 74 },
    { x: 4270, w: 74 },
    { x: 4700, w: 74 },
    { x: 5130, w: 74 },
  ],
  horizontal: [
    { y: 300, w: 74 },
    { y: 600, w: 74 },
    { y: 900, w: 74 },
  ],
};
