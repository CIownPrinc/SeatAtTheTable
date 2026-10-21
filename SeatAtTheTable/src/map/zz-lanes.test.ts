import { it } from 'vitest';
import { COUNTRY_ROADS } from './countryRoads';
import { isPointInWater } from './geometry';
import { windhavenMapModel } from './mapModel';
import { pointInPolygon } from './geometry';
it('lanes', () => {
  const out: string[] = [];
  COUNTRY_ROADS.forEach(road => road.path.forEach((p, i) => {
    if(isPointInWater(p, road.width / 2)) out.push(`${road.id} #${i} ${Math.round(p.x)},${Math.round(p.y)} WATER`);
    else if(pointInPolygon(p, windhavenMapModel.lakefrontBeach)) out.push(`${road.id} #${i} ${Math.round(p.x)},${Math.round(p.y)} BEACH`);
  }));
  process.stdout.write((out.join('\n') || 'none') + '\n');
});
