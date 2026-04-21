-- Vocabulary unit: color + noun phrases (agreement), not bare color lemmas.

insert into public.units (id, topic_id, slug, title, description, content_module, content_config, sort_order)
values (
  '11111111-1111-4111-8111-00000000001d',
  '11111111-1111-1111-1111-111111111199',
  'vocabulary-colors-nouns',
  'Vocabulary — Colors with nouns',
  'Russian color adjectives with agreeing nouns (phrases, not isolated color words).',
  'vocabulary',
  '{"vocabularySetId":"colors_nouns","sessionLength":15}'::jsonb,
  28
)
on conflict (topic_id, slug) do nothing;
