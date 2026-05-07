import { describe, expect, it } from 'vitest';
import { matchesShortcut, normalizeShortcuts } from '../Command';

describe('Command shortcut handling', () => {
  it('ignores empty runtime shortcut values', () => {
    expect(normalizeShortcuts(['mod+k', undefined as unknown as string, '', '  '])).toEqual([
      'mod+k',
    ]);
  });

  it('does not throw when shortcut is undefined at runtime', () => {
    const event = {
      key: 'k',
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    };

    expect(matchesShortcut(event, undefined)).toBe(false);
  });

  it('matches mod shortcut with meta or ctrl', () => {
    expect(
      matchesShortcut(
        { key: 'k', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false },
        'mod+k',
      ),
    ).toBe(true);
    expect(
      matchesShortcut(
        { key: 'k', metaKey: false, ctrlKey: true, shiftKey: false, altKey: false },
        'mod+k',
      ),
    ).toBe(true);
  });
});
