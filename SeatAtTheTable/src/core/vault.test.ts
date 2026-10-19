import { describe, expect, it } from 'vitest';
import { depositToVault, withdrawFromVault } from './vault';

describe('vault', function () {
  it('moves cash from your pocket into the vault', function () {
    expect(depositToVault({ cash: 5000, vault: 0 }, 2000)).toEqual({ cash: 3000, vault: 2000 });
  });

  it('never deposits more than you are carrying', function () {
    expect(depositToVault({ cash: 500, vault: 100 }, 2000)).toEqual({ cash: 0, vault: 600 });
  });

  it('takes cash back out, never more than is in there', function () {
    expect(withdrawFromVault({ cash: 0, vault: 700 }, 1000)).toEqual({ cash: 700, vault: 0 });
  });

  it('ignores negative amounts rather than reversing the transfer', function () {
    expect(depositToVault({ cash: 500, vault: 100 }, -50)).toEqual({ cash: 500, vault: 100 });
  });
});
