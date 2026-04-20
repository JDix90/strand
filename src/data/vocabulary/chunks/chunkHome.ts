import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_ROOMS = `
komnata|комната|room|n
kuhnja|кухня|kitchen|n
vannaja|ванная|bathroom|n
tualet|туалет|toilet|n
koridor|коридор|hallway|n
prihozhaja|прихожая|entryway|n
gostinaja|гостиная|living room|n
spalnja|спальня|bedroom|n
detskaja|детская|children room|n
kabinet|кабинет|study|n
balkon|балкон|balcony|n
lodzhija|лоджия|loggia|n
cherdak|чердак|attic|n
podval|подвал|basement|n
krysha|крыша|roof|n
steny|стены|walls|n
pol|пол|floor|n
potolok|потолок|ceiling|n
okno|окно|window|n
dver|дверь|door|n
zamok_dveri|замок|lock|n
ruchka|ручка|door handle|n
dom|дом|house|n
kvartira|квартира|apartment|n
jetazh_dom|этаж|floor level|n
chastnyj_dom|частный дом|private house|n
mnogokvartirnyj|многоквартирный|apartment building|n
`;

const RAW_FURNITURE = `
stol|стол|table|n
stul|стул|chair|n
divan|диван|sofa|n
kreslo|кресло|armchair|n
shkaf|шкаф|wardrobe|n
polka|полка|shelf|n
knizhnyj_shkaf|книжный шкаф|bookcase|n
krovat_mebel|кровать|bed|n
tumbochka|тумбочка|nightstand|n
zerkalo|зеркало|mirror|n
kovjor|ковёр|rug|n
shtory_mebel|шторы|curtains|n
ljustra|люстра|chandelier|n
kartina|картина|painting|n
chasy|часы|clock|n
vaza|ваза|vase|n
svecha|свеча|candle|n
podstavka|подставка|stand|n
korzina|корзина|basket|n
jaschik|ящик|box|n
instrument|инструмент|tool|n
molotok|молоток|hammer|n
otvjortka|отвёртка|screwdriver|n
gvozdi|гвозди|nails|n
`;

const RAW_KITCHEN = `
holodilnik|холодильник|refrigerator|n
plita|плита|stove|n
duhovka|духовка|oven|n
mikrovolnovka|микроволновка|microwave|n
chainik|чайник|kettle|n
kastrjulja|кастрюля|pot|n
skovorodka|сковородка|pan|n
nozh|нож|knife|n
vilka|вилка|fork|n
lozhka|ложка|spoon|n
tarelka|тарелка|plate|n
chashka_kuh|чашка|cup|n
banka|банка|jar|n
kryshka|крышка|lid|n
doska|доска|cutting board|n
polotentse_kuh|полотенце|towel|n
gubka|губка|sponge|n
moejuschee|моющее средство|detergent|n
musor|мусор|trash|n
vedro|ведро|bucket|n
pylesos|пылесос|vacuum cleaner|n
shvabra|швабра|mop|n
tjanet|тряпка|rag|n
stiralnaja_mashina|стиральная машина|washing machine|n
sushilka|сушилка|drying rack|n
skovoroda_gril|сковорода-гриль|grill pan|n
blender|блендер|blender|n
mikser|миксер|mixer|n
vesy_kuh|весы|kitchen scale|n
tajmer|таймер|timer|n
fartuk|фартук|apron|n
perchatki_kuh|перчатки кухонные|oven mitts|n
polovnik|половник|ladle|n
venchik|венчик|whisk|n
terka|тёрка|grater|n
ovoschechistka|овощечистка|peeler|n
nozhnitsy|ножницы|scissors|n
skotch|скотч|tape|n
folga|фольга|foil|n
pergament|пергамент|parchment paper|n
paket_zamorozh|пакет для заморозки|freezer bag|n
kontejner|контейнер|container|n
banka_stekl|стеклянная банка|glass jar|n
kryshka_zakatochnaja|закаточная крышка|canning lid|n
`;

const home_rooms = parseCompactDeck('home_rooms', RAW_ROOMS);
const home_furniture = parseCompactDeck('home_furniture', RAW_FURNITURE);
const home_kitchen = parseCompactDeck('home_kitchen', RAW_KITCHEN);

const DECKS: Record<string, VocabEntry[]> = {
  home_rooms,
  home_furniture,
  home_kitchen,
};

export function getHomeChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
