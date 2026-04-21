-- Vocabulary unit: color + noun inside short sentences (various cases).

insert into public.units (id, topic_id, slug, title, description, content_module, content_config, sort_order)
values (
  '11111111-1111-4111-8111-00000000001e',
  '11111111-1111-1111-1111-111111111199',
  'vocabulary-colors-case-sentences',
  'Vocabulary — Colors in sentences (cases)',
  'Short realistic sentences with color adjectives agreeing with nouns in context (accusative, genitive, instrumental, prepositional, etc.).',
  'vocabulary',
  '{"vocabularySetId":"colors_case_sentences","sessionLength":15}'::jsonb,
  29
)
on conflict (topic_id, slug) do nothing;
