import type { VocabCategoryMeta, VocabSubcategoryMeta } from './types';

/**
 * Top-level categories + subcategories for navigation and curriculum units.
 * Each `vocabularySetId` maps 1:1 to a `units` row (see migration 006).
 */
export const VOCABULARY_TAXONOMY: VocabCategoryMeta[] = [
  {
    id: 'food',
    label: 'Food & drink',
    sortOrder: 0,
    subcategories: [
      { id: 'beverages', label: 'Beverages', vocabularySetId: 'food_beverages' },
      { id: 'staples', label: 'Staples & ingredients', vocabularySetId: 'food_staples' },
      { id: 'meals', label: 'Meals & eating out', vocabularySetId: 'food_meals' },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    sortOrder: 1,
    subcategories: [
      { id: 'transport', label: 'Transport', vocabularySetId: 'travel_transport' },
      { id: 'places', label: 'Places & sights', vocabularySetId: 'travel_places' },
      { id: 'lodging', label: 'Lodging & tickets', vocabularySetId: 'travel_lodging' },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    sortOrder: 2,
    subcategories: [
      { id: 'rooms', label: 'Rooms & spaces', vocabularySetId: 'home_rooms' },
      { id: 'furniture', label: 'Furniture & objects', vocabularySetId: 'home_furniture' },
      { id: 'kitchen', label: 'Kitchen & cleaning', vocabularySetId: 'home_kitchen' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    sortOrder: 3,
    subcategories: [
      { id: 'family', label: 'Family & relations', vocabularySetId: 'people_family' },
      { id: 'roles', label: 'Roles & jobs', vocabularySetId: 'people_roles' },
      { id: 'traits', label: 'Traits & feelings', vocabularySetId: 'people_traits' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    sortOrder: 4,
    subcategories: [
      { id: 'animals', label: 'Animals', vocabularySetId: 'nature_animals' },
      { id: 'weather', label: 'Weather & seasons', vocabularySetId: 'nature_weather' },
      { id: 'environment', label: 'Plants & landscape', vocabularySetId: 'nature_environment' },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    sortOrder: 5,
    subcategories: [
      { id: 'clock', label: 'Clock & frequency', vocabularySetId: 'time_clock' },
      { id: 'calendar', label: 'Calendar', vocabularySetId: 'time_calendar' },
    ],
  },
  {
    id: 'body_health',
    label: 'Body & health',
    sortOrder: 6,
    subcategories: [
      { id: 'body', label: 'Body parts', vocabularySetId: 'body_parts' },
      { id: 'health', label: 'Health & medicine', vocabularySetId: 'body_health' },
    ],
  },
  {
    id: 'work_city',
    label: 'Work & city',
    sortOrder: 7,
    subcategories: [
      { id: 'work', label: 'Work & office', vocabularySetId: 'work_office' },
      { id: 'city', label: 'City & directions', vocabularySetId: 'city_urban' },
    ],
  },
  {
    id: 'shopping_school',
    label: 'Shopping & school',
    sortOrder: 8,
    subcategories: [
      { id: 'shopping', label: 'Shopping & clothes', vocabularySetId: 'shopping_general' },
      { id: 'school', label: 'School & learning', vocabularySetId: 'school_learning' },
      { id: 'tech', label: 'Technology', vocabularySetId: 'technology_digital' },
    ],
  },
  {
    id: 'verbs_adj',
    label: 'Verbs & adjectives',
    sortOrder: 9,
    subcategories: [
      { id: 'verbs_core', label: 'Common verbs', vocabularySetId: 'verbs_common' },
      { id: 'verbs_motion', label: 'Motion & position', vocabularySetId: 'verbs_motion' },
      { id: 'adj_quality', label: 'Adjectives — quality', vocabularySetId: 'adjectives_quality' },
      { id: 'adj_quantity', label: 'Adjectives — quantity & degree', vocabularySetId: 'adjectives_quantity' },
    ],
  },
];

/** Flat list of all `vocabularySetId` values (order matches migration seed). */
export const VOCABULARY_SET_IDS: string[] = VOCABULARY_TAXONOMY.flatMap(c =>
  c.subcategories.map(s => s.vocabularySetId),
);

export function isKnownVocabularySetId(id: string): boolean {
  return VOCABULARY_SET_IDS.includes(id);
}

export function getSubcategoryMeta(vocabularySetId: string): VocabSubcategoryMeta | undefined {
  for (const c of VOCABULARY_TAXONOMY) {
    const s = c.subcategories.find(x => x.vocabularySetId === vocabularySetId);
    if (s) return s;
  }
  return undefined;
}
