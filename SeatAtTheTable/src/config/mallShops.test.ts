import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_LOOK, WARDROBE } from '../map/personModel';
import { MALL_SHOPS, isItemOwned, itemPrice, lookPrice, ownedWardrobe } from './mallShops';

describe('mall shops', function () {
  it('leaves the default look free, so a new game owns what Arjun has on', function () {
    expect(lookPrice([], DEFAULT_PLAYER_LOOK)).toBe(0);
  });

  it('sells every item that is not a basic at exactly one shop', function () {
    for(const slot of Object.keys(WARDROBE) as Array<keyof typeof WARDROBE>){
      for(const value of WARDROBE[slot]){
        const sellers = MALL_SHOPS.filter(shop => shop.slot === slot && shop.items[value] !== undefined);
        expect(sellers.length, `${slot}:${value}`).toBe(itemPrice(slot, value) === null ? 0 : 1);
      }
    }
  });

  it('charges for what you put on and not for what you already own', function () {
    const look = { ...DEFAULT_PLAYER_LOOK, hat: 'fedora' as const, extra: 'chain' as const };
    expect(lookPrice([], look)).toBe(180 + 900);
    expect(lookPrice(['hat:fedora'], look)).toBe(900);
    expect(isItemOwned(['hat:fedora'], 'hat', 'fedora')).toBe(true);
  });

  it('lets an old save keep whatever Arjun was already wearing', function () {
    const owned = ownedWardrobe(undefined, { ...DEFAULT_PLAYER_LOOK, extra: 'sunglasses' });
    expect(owned).toContain('extra:sunglasses');
    expect(ownedWardrobe(['shoes:boots', 7], DEFAULT_PLAYER_LOOK)).toEqual(['shoes:boots']);
  });
});
