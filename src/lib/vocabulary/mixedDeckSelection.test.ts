import { describe, expect, it } from 'vitest';
import { deckSelectionKey, normalizeDeckSelection } from './mixedDeckSelection';

describe('normalizeDeckSelection', () => {
  it('dedupes and drops blank entries preserving first-seen order', () => {
    expect(
      normalizeDeckSelection([
        'food_beverages',
        'travel_places',
        'food_beverages',
        ' ',
        'travel_places',
        'home_furniture',
      ]),
    ).toEqual(['food_beverages', 'travel_places', 'home_furniture']);
  });
});

describe('deckSelectionKey', () => {
  it('is stable for content-equivalent selections', () => {
    const a = ['food_beverages', 'travel_places', 'food_beverages'];
    const b = ['food_beverages', 'travel_places'];
    expect(deckSelectionKey(a)).toBe(deckSelectionKey(b));
  });

  it('changes when selection changes', () => {
    expect(deckSelectionKey(['food_beverages', 'travel_places'])).not.toBe(
      deckSelectionKey(['food_beverages', 'home_furniture']),
    );
  });
});
