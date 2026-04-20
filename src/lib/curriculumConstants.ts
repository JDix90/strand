/** Must match supabase/migrations/005_curriculum.sql seed `russian-declension-core` unit. */
export const DEFAULT_RUSSIAN_UNIT_ID = '11111111-1111-1111-1111-111111111103';

export const RUSSIAN_DECLENSION_MODULE = 'russian_declension' as const;

/** Primary module id for vocabulary units (see migration 006). */
export const VOCABULARY_MODULE = 'vocabulary' as const;

/** Legacy seed id from migration 005; treated the same as {@link VOCABULARY_MODULE} in the client. */
export const VOCABULARY_STUB_MODULE = 'vocabulary_stub' as const;
