import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_BEVERAGES = `
moloko|молоко|milk|n
voda|вода|water|n
chai|чай|tea|n
kofe|кофе|coffee|n
sok|сок|juice|n
vino|вино|wine|n
pivo|пиво|beer|n
limonad|лимонад|lemonade|n
kompot|компот|stewed fruit drink|n
kisiel|кисель|kissel|n
kefir|кефир|kefir|n
rjazhenka|ряженка|baked milk|n
mineralnaja_voda|минеральная вода|mineral water|n
gazirovka|газировка|soda|n
morozhenoe|мороженое|ice cream|n
med|мёд|honey|n
varene|варенье|jam|n
sahar|сахар|sugar|n
sol|соль|salt|n
maslo_slivochnoe|масло сливочное|butter|n
maslo_rastitelnoe|масло растительное|vegetable oil|n
uksus|уксус|vinegar|n
soevyj_sous|соевый соус|soy sauce|n
kvas|квас|kvass|n
samogon|самогон|moonshine|n
konjak|коньяк|cognac|n
vodka|водка|vodka|n
likjor|ликёр|liqueur|n
koktejl|коктейль|cocktail|n
smuzi|смузи|smoothie|n
energetik|энергетик|energy drink|n
bulon|бульон|broth|n
otvar|отвар|decoction|n
kislyj_molochnyj_napitok|кисломолочный напиток|fermented milk drink|n
rjumka|рюмка|shot glass|n
chashka|чашка|cup|n
bokal|бокал|wine glass|n
`;

const RAW_STAPLES = `
hleb|хлеб|bread|n
muka|мука|flour|n
krupa|крупа|groats|n
ris|рис|rice|n
grechka|гречка|buckwheat|n
ovsjanaja_kasha|овсянка|oatmeal|n
psheno|пшено|millet|n
makaroni|макароны|pasta|n
vermishel|вермишель|vermicelli|n
lapsha|лапша|noodles|n
kartoshka|картошка|potato|n
morkov|морковь|carrot|n
luk|лук|onion|n
chesnok|чеснок|garlic|n
pomidor|помидор|tomato|n
ogurec|огурец|cucumber|n
kapusta|капуста|cabbage|n
jabloko|яблоко|apple|n
banan|банан|banana|n
apelsin|апельсин|orange|n
limon|лимон|lemon|n
vinograd|виноград|grapes|n
klubnika|клубника|strawberry|n
malina|малина|raspberry|n
griby|грибы|mushrooms|n
fasol|фасоль|beans|n
goroh|горох|peas|n
kukuruza|кукуруза|corn|n
perets|перец|pepper|n
baklazhan|баклажан|eggplant|n
kabachok|кабачок|zucchini|n
tikva|тыква|pumpkin|n
rediska|редиска|radish|n
svekla|свёкла|beet|n
losos|лосось|salmon|n
tunets|тунец|tuna|n
krevetka|креветка|shrimp|n
ikra|икра|caviar|n
kolbasa|колбаса|sausage|n
sosiska|сосиска|hot dog|n
bekon|бекон|bacon|n
vetchina|ветчина|ham|n
syr|сыр|cheese|n
tvorog|творог|cottage cheese|n
jajtso|яйцо|egg|n
slivki|сливки|cream|n
smetana|сметана|sour cream|n
majonez|майонез|mayonnaise|n
gorchitsa|горчица|mustard|n
ketchup|кетчуп|ketchup|n
kasha_grechnevaja|гречневая каша|buckwheat porridge|n
kasha_ovsjannaja|овсяная каша|oat porridge|n
risovaja_kasha|рисовая каша|rice porridge|n
mjaso|мясо|meat|n
govjadina|говядина|beef|n
svinina|свинина|pork|n
kuritsa_mjaso|курица|chicken meat|n
indejka|индейка|turkey|n
baranina|баранина|lamb|n
kotleta|котлета|cutlet|n
tefteli|тефтели|meatballs|n
zharkoe|жаркое|stew|n
guljash|гуляш|goulash|n
shashlyk|шашлык|shish kebab|n
rassolnik|рассольник|pickle soup|n
gribnoj_sup|грибной суп|mushroom soup|n
gaspacho|гаспачо|gazpacho|n
kompot_dom|компот|compote|n
varene_vishnja|варенье вишнёвое|cherry jam|n
pastila|пастила|fruit leather|n
zefir|зефир|marshmallow treat|n
halva|халва|halva|n
shokoladka|шоколадка|chocolate bar|n
konfeta|конфета|candy|n
pechene_ovsjanoe|овсяное печенье|oat cookie|n
bublik|бублик|bagel|n
sushka|сушка|dry bagel ring|n
hleb_rzhanoj|ржаной хлеб|rye bread|n
lavash|лаваш|lavash|n
lepesha|лепёшка|flatbread|n
peljmeni_zamorozh|пельмени замороженные|frozen pelmeni|n
vareniki_kartofel|вареники с картошкой|potato vareniki|n
smetannik|сметанник|sour cream pastry|n
kvas_hlebnyj|хлебный квас|bread kvass|n
`;

const RAW_MEALS = `
zavtrak|завтрак|breakfast|n
obed|обед|lunch|n
uzhin|ужин|dinner|n
polnik|полдник|afternoon snack|n
sup|суп|soup|n
borshch|борщ|borscht|n
schhi|щи|cabbage soup|n
soljanka|солянка|solyanka|n
okroshka|окрошка|okroshka|n
ukha|уха|fish soup|n
kotlety|котлеты|cutlets|n
pelmeni|пельмени|pelmeni|n
vareniki|вареники|vareniki|n
bliny|блины|blini|n
oladi|оладьи|fritters|n
kasha|каша|porridge|n
plov|плов|pilaf|n
golubcy|голубцы|cabbage rolls|n
syrniki|сырники|cheese pancakes|n
sous|соус|sauce|n
salat|салат|salad|n
zakuska|закуска|appetizer|n
garnir|гарнир|side dish|n
desert|десерт|dessert|n
pechene|печенье|cookies|n
tort|торт|cake|n
pirozhok|пирожок|pie|n
pirog|пирог|pie|n
konfety|конфеты|candy|n
shokolad|шоколад|chocolate|n
morozhenoe_desert|мороженое|ice cream dessert|n
menju|меню|menu|n
schet|счёт|bill|n
chaevye|чаевые|tip|n
oficiant|официант|waiter|n
kafe|кафе|cafe|n
restoran|ресторан|restaurant|n
kafe_pitstserija|пиццерия|pizzeria|n
stolovaja|столовая|canteen|n
bystroe_pitanije|быстрое питание|fast food|n
dostavka_edy|доставка еды|food delivery|n
kurer|курьер|courier|n
ofitsiantka|официантка|waitress|n
bar_stojka|барная стойка|bar counter|n
bokal_vina|бокал вина|glass of wine|n
butylka|бутылка|bottle|n
banka_konserv|банка консервов|can of preserves|n
konservy|консервы|canned food|n
pashtet|паштет|pâté|n
ikra_kabachkovaja|икра кабачковая|vegetable caviar|n
solenja|соленья|pickles|n
marinady|маринады|marinades|n
kvashenaja_kapusta|квашеная капуста|sauerkraut|n
`;

const food_beverages = parseCompactDeck('food_beverages', RAW_BEVERAGES);
const food_staples = parseCompactDeck('food_staples', RAW_STAPLES);
const food_meals = parseCompactDeck('food_meals', RAW_MEALS);

const DECKS: Record<string, VocabEntry[]> = {
  food_beverages,
  food_staples,
  food_meals,
};

export function getFoodChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
