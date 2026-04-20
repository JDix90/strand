import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_ANIMALS = `
sobaka_nat|собака|dog|n
koschka_nat|кошка|cat|n
loshad|лошадь|horse|n
korova|корова|cow|n
svinja|свинья|pig|n
baran|баран|ram|n
koza|коза|goat|n
kuritsa|курица|chicken|n
utka|утка|duck|n
gus|гусь|goose|n
volk|волк|wolf|n
medved|медведь|bear|n
lisitsa|лисица|fox|n
zajats|заяц|hare|n
belka|белка|squirrel|n
mysh|мышь|mouse|n
ptitsa|птица|bird|n
orjol|орёл|eagle|n
vorona|ворона|crow|n
lastochka|ласточка|swallow|n
zhuravl|журавль|crane|n
ryba_nat|рыба|fish|n
akula|акула|shark|n
kit|кит|whale|n
zmja|змея|snake|n
jascheritsa|ящерица|lizard|n
cherepakha|черепаха|turtle|n
komar|комар|mosquito|n
muravej|муравей|ant|n
pchela|пчела|bee|n
babochka|бабочка|butterfly|n
lev|лев|lion|n
tigr|тигр|tiger|n
slon|слон|elephant|n
zhiraf|жираф|giraffe|n
obezyana|обезьяна|monkey|n
pingvin|пингвин|penguin|n
delfin|дельфин|dolphin|n
osjotr|осётр|sturgeon|n
karas|карась|crucian carp|n
leshch|лещ|bream|n
sudak|судак|pike-perch|n
forel|форель|trout|n
losos_nat|лосось|salmon|n
krab|краб|crab|n
omar|омар|lobster|n
ulitka|улитка|snail|n
pauchok|паучок|spider|n
muha|муха|fly|n
`;

const RAW_WEATHER = `
solntse|солнце|sun|n
luna|луна|moon|n
zvezda|звезда|star|n
nebo|небо|sky|n
oblako|облако|cloud|n
dozhd|дождь|rain|n
sneg|снег|snow|n
veter|ветер|wind|n
groza|гроза|thunderstorm|n
molinja|молния|lightning|n
grom|гром|thunder|n
tuman|туман|fog|n
moroz|мороз|frost|n
zhara|жара|heat|n
vesna|весна|spring|n
leto|лето|summer|n
osen|осень|autumn|n
zima|зима|winter|n
gradus|градус|degree|n
temperatura|температура|temperature|n
prognoz|прогноз|forecast|n
snegopad|снегопад|snowfall|n
dozhdik|дождик|drizzle|n
raduga|радуга|rainbow|n
veter_severnyj|северный ветер|north wind|n
uragan|ураган|hurricane|n
metel|метель|blizzard|n
`;

const RAW_ENV = `
derevo|дерево|tree|n
trava|трава|grass|n
tsvetok|цветок|flower|n
list|лист|leaf|n
koren|корень|root|n
zemlja_nat|земля|earth|n
pesok|песок|sand|n
kamni|камни|stones|n
skala|скала|cliff|n
reka_nat|река|river|n
ozero_nat|озеро|lake|n
boloto|болото|swamp|n
step|степь|steppe|n
tajga|тайга|taiga|n
pustynja|пустыня|desert|n
okean|океан|ocean|n
bereg_nat|берег|shore|n
ostrov_nat|остров|island|n
les_nat|лес|forest|n
poljana|поляна|clearing|n
roshcha|роща|grove|n
`;

const nature_animals = parseCompactDeck('nature_animals', RAW_ANIMALS);
const nature_weather = parseCompactDeck('nature_weather', RAW_WEATHER);
const nature_environment = parseCompactDeck('nature_environment', RAW_ENV);

const DECKS: Record<string, VocabEntry[]> = {
  nature_animals,
  nature_weather,
  nature_environment,
};

export function getNatureChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
