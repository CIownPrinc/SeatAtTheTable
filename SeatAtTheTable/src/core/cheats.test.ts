import { describe, expect, it } from 'vitest';
import { createCheatListener } from './cheats';

function type(listener: ReturnType<typeof createCheatListener>, text: string): string[] {
  return [...text].map(key => listener.feed(key)).filter((code): code is string => code !== null);
}

describe('createCheatListener', function () {
  it('recognises a code typed in full', function () {
    expect(type(createCheatListener(['cash4ever']), 'cash4ever')).toEqual(['cash4ever']);
  });

  it('finds a code typed after other keys', function () {
    expect(type(createCheatListener(['moneymoneymoney']), 'wwasdmoneymoneymoney')).toEqual(['moneymoneymoney']);
  });

  it('ignores case, so caps lock does not break it', function () {
    expect(type(createCheatListener(['cash4ever']), 'CASH4EVER')).toEqual(['cash4ever']);
  });

  it('fires again when typed again', function () {
    expect(type(createCheatListener(['cash4ever']), 'cash4evercash4ever')).toHaveLength(2);
  });

  it('ignores keys that are not a single character, like Shift', function () {
    const listener = createCheatListener(['cash4ever']);
    const fired = ['c', 'a', 'Shift', 's', 'h', '4', 'e', 'v', 'e', 'r'].map(key => listener.feed(key));
    expect(fired.at(-1)).toBe('cash4ever');
  });
});
