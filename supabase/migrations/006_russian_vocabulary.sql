-- Russian vocabulary topic + units (one per vocabularySetId). Moves legacy food stub off nominal declension topic.

insert into public.topics (id, subject_id, slug, title, sort_order)
values (
  '11111111-1111-1111-1111-111111111199',
  '11111111-1111-1111-1111-111111111101',
  'russian-vocabulary',
  'Russian vocabulary',
  1
)
on conflict (subject_id, slug) do nothing;

-- Legacy preview unit: same id, new topic + module + config
update public.units
set
  topic_id = '11111111-1111-1111-1111-111111111199',
  content_module = 'vocabulary',
  content_config = '{"vocabularySetId":"food_beverages","sessionLength":15}'::jsonb,
  title = 'Vocabulary — Food — Beverages',
  description = 'Russian–English vocabulary: beverages.',
  slug = 'vocabulary-food-beverages',
  sort_order = 0
where id = '11111111-1111-1111-1111-111111111107';

insert into public.units (id, topic_id, slug, title, description, content_module, content_config, sort_order)
values
  ('11111111-1111-4111-8111-000000000002', '11111111-1111-1111-1111-111111111199', 'vocabulary-food-staples', 'Vocabulary — Food — Staples & ingredients', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"food_staples","sessionLength":15}'::jsonb, 1),
  ('11111111-1111-4111-8111-000000000003', '11111111-1111-1111-1111-111111111199', 'vocabulary-food-meals', 'Vocabulary — Food — Meals & eating out', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"food_meals","sessionLength":15}'::jsonb, 2),
  ('11111111-1111-4111-8111-000000000004', '11111111-1111-1111-1111-111111111199', 'vocabulary-travel-transport', 'Vocabulary — Travel — Transport', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"travel_transport","sessionLength":15}'::jsonb, 3),
  ('11111111-1111-4111-8111-000000000005', '11111111-1111-1111-1111-111111111199', 'vocabulary-travel-places', 'Vocabulary — Travel — Places & sights', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"travel_places","sessionLength":15}'::jsonb, 4),
  ('11111111-1111-4111-8111-000000000006', '11111111-1111-1111-1111-111111111199', 'vocabulary-travel-lodging', 'Vocabulary — Travel — Lodging & tickets', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"travel_lodging","sessionLength":15}'::jsonb, 5),
  ('11111111-1111-4111-8111-000000000007', '11111111-1111-1111-1111-111111111199', 'vocabulary-home-rooms', 'Vocabulary — Home — Rooms & spaces', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"home_rooms","sessionLength":15}'::jsonb, 6),
  ('11111111-1111-4111-8111-000000000008', '11111111-1111-1111-1111-111111111199', 'vocabulary-home-furniture', 'Vocabulary — Home — Furniture & objects', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"home_furniture","sessionLength":15}'::jsonb, 7),
  ('11111111-1111-4111-8111-000000000009', '11111111-1111-1111-1111-111111111199', 'vocabulary-home-kitchen', 'Vocabulary — Home — Kitchen & cleaning', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"home_kitchen","sessionLength":15}'::jsonb, 8),
  ('11111111-1111-4111-8111-00000000000a', '11111111-1111-1111-1111-111111111199', 'vocabulary-people-family', 'Vocabulary — People — Family & relations', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"people_family","sessionLength":15}'::jsonb, 9),
  ('11111111-1111-4111-8111-00000000000b', '11111111-1111-1111-1111-111111111199', 'vocabulary-people-roles', 'Vocabulary — People — Roles & jobs', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"people_roles","sessionLength":15}'::jsonb, 10),
  ('11111111-1111-4111-8111-00000000000c', '11111111-1111-1111-1111-111111111199', 'vocabulary-people-traits', 'Vocabulary — People — Traits & feelings', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"people_traits","sessionLength":15}'::jsonb, 11),
  ('11111111-1111-4111-8111-00000000000d', '11111111-1111-1111-1111-111111111199', 'vocabulary-nature-animals', 'Vocabulary — Nature — Animals', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"nature_animals","sessionLength":15}'::jsonb, 12),
  ('11111111-1111-4111-8111-00000000000e', '11111111-1111-1111-1111-111111111199', 'vocabulary-nature-weather', 'Vocabulary — Nature — Weather & seasons', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"nature_weather","sessionLength":15}'::jsonb, 13),
  ('11111111-1111-4111-8111-00000000000f', '11111111-1111-1111-1111-111111111199', 'vocabulary-nature-environment', 'Vocabulary — Nature — Plants & landscape', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"nature_environment","sessionLength":15}'::jsonb, 14),
  ('11111111-1111-4111-8111-000000000010', '11111111-1111-1111-1111-111111111199', 'vocabulary-time-clock', 'Vocabulary — Time — Clock & frequency', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"time_clock","sessionLength":15}'::jsonb, 15),
  ('11111111-1111-4111-8111-000000000011', '11111111-1111-1111-1111-111111111199', 'vocabulary-time-calendar', 'Vocabulary — Time — Calendar', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"time_calendar","sessionLength":15}'::jsonb, 16),
  ('11111111-1111-4111-8111-000000000012', '11111111-1111-1111-1111-111111111199', 'vocabulary-body-parts', 'Vocabulary — Body — Body parts', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"body_parts","sessionLength":15}'::jsonb, 17),
  ('11111111-1111-4111-8111-000000000013', '11111111-1111-1111-1111-111111111199', 'vocabulary-body-health', 'Vocabulary — Body — Health & medicine', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"body_health","sessionLength":15}'::jsonb, 18),
  ('11111111-1111-4111-8111-000000000014', '11111111-1111-1111-1111-111111111199', 'vocabulary-work-office', 'Vocabulary — Work — Work & office', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"work_office","sessionLength":15}'::jsonb, 19),
  ('11111111-1111-4111-8111-000000000015', '11111111-1111-1111-1111-111111111199', 'vocabulary-city-urban', 'Vocabulary — City — City & directions', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"city_urban","sessionLength":15}'::jsonb, 20),
  ('11111111-1111-4111-8111-000000000016', '11111111-1111-1111-1111-111111111199', 'vocabulary-shopping-general', 'Vocabulary — Shopping — Shopping & clothes', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"shopping_general","sessionLength":15}'::jsonb, 21),
  ('11111111-1111-4111-8111-000000000017', '11111111-1111-1111-1111-111111111199', 'vocabulary-school-learning', 'Vocabulary — School — School & learning', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"school_learning","sessionLength":15}'::jsonb, 22),
  ('11111111-1111-4111-8111-000000000018', '11111111-1111-1111-1111-111111111199', 'vocabulary-technology-digital', 'Vocabulary — Technology — Technology', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"technology_digital","sessionLength":15}'::jsonb, 23),
  ('11111111-1111-4111-8111-000000000019', '11111111-1111-1111-1111-111111111199', 'vocabulary-verbs-common', 'Vocabulary — Verbs — Common verbs', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"verbs_common","sessionLength":15}'::jsonb, 24),
  ('11111111-1111-4111-8111-00000000001a', '11111111-1111-1111-1111-111111111199', 'vocabulary-verbs-motion', 'Vocabulary — Verbs — Motion & position', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"verbs_motion","sessionLength":15}'::jsonb, 25),
  ('11111111-1111-4111-8111-00000000001b', '11111111-1111-1111-1111-111111111199', 'vocabulary-adjectives-quality', 'Vocabulary — Adjectives — Quality', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"adjectives_quality","sessionLength":15}'::jsonb, 26),
  ('11111111-1111-4111-8111-00000000001c', '11111111-1111-1111-1111-111111111199', 'vocabulary-adjectives-quantity', 'Vocabulary — Adjectives — Quantity & degree', 'Russian–English vocabulary.', 'vocabulary', '{"vocabularySetId":"adjectives_quantity","sessionLength":15}'::jsonb, 27)
on conflict (topic_id, slug) do nothing;
