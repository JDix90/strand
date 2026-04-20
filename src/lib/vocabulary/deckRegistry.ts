import type { VocabEntry } from '../../data/vocabulary/types';

/** Maps each `vocabularySetId` to a lazy-loaded chunk key. */
export const VOCABULARY_SET_CHUNK: Record<string, string> = {
  food_beverages: 'food',
  food_staples: 'food',
  food_meals: 'food',
  travel_transport: 'travel',
  travel_places: 'travel',
  travel_lodging: 'travel',
  home_rooms: 'home',
  home_furniture: 'home',
  home_kitchen: 'home',
  people_family: 'people',
  people_roles: 'people',
  people_traits: 'people',
  nature_animals: 'nature',
  nature_weather: 'nature',
  nature_environment: 'nature',
  time_clock: 'timeBody',
  time_calendar: 'timeBody',
  body_parts: 'timeBody',
  body_health: 'timeBody',
  work_office: 'workUrban',
  city_urban: 'workUrban',
  shopping_general: 'workUrban',
  school_learning: 'workUrban',
  technology_digital: 'workUrban',
  verbs_common: 'verbsAdj',
  verbs_motion: 'verbsAdj',
  adjectives_quality: 'verbsAdj',
  adjectives_quantity: 'verbsAdj',
};

type ChunkGetter = (vocabularySetId: string) => VocabEntry[] | undefined;

const chunkLoaders: Record<string, () => Promise<ChunkGetter>> = {
  food: async () => (await import('../../data/vocabulary/chunks/chunkFood')).getFoodChunkDeck,
  travel: async () => (await import('../../data/vocabulary/chunks/chunkTravel')).getTravelChunkDeck,
  home: async () => (await import('../../data/vocabulary/chunks/chunkHome')).getHomeChunkDeck,
  people: async () => (await import('../../data/vocabulary/chunks/chunkPeople')).getPeopleChunkDeck,
  nature: async () => (await import('../../data/vocabulary/chunks/chunkNature')).getNatureChunkDeck,
  timeBody: async () => (await import('../../data/vocabulary/chunks/chunkTimeBody')).getTimeBodyChunkDeck,
  workUrban: async () => (await import('../../data/vocabulary/chunks/chunkWorkUrban')).getWorkUrbanChunkDeck,
  verbsAdj: async () => (await import('../../data/vocabulary/chunks/chunkVerbsAdj')).getVerbsAdjChunkDeck,
};

const chunkGetterCache = new Map<string, ChunkGetter>();

async function resolveChunkGetter(chunkKey: string): Promise<ChunkGetter | undefined> {
  const cached = chunkGetterCache.get(chunkKey);
  if (cached) return cached;
  const loader = chunkLoaders[chunkKey];
  if (!loader) return undefined;
  const getter = await loader();
  chunkGetterCache.set(chunkKey, getter);
  return getter;
}

/** Lazy-load lemmas for a curriculum `vocabularySetId`. */
export async function loadVocabularyDeck(vocabularySetId: string): Promise<VocabEntry[]> {
  const chunkKey = VOCABULARY_SET_CHUNK[vocabularySetId];
  if (!chunkKey) return [];
  const getter = await resolveChunkGetter(chunkKey);
  const deck = getter?.(vocabularySetId);
  return deck ?? [];
}
