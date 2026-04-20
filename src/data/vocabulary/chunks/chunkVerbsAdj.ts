import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_VERBS_COMMON = `
delat|делать|to do|v
rabotat|работать|to work|v
uchitsja|учиться|to study|v
uchit|учить|to teach|v
zhit|жить|to live|v
est|есть|to eat|v
pit|пить|to drink|v
spat|спать|to sleep|v
guljat|гулять|to walk|v
begat|бегать|to run|v
letet|лететь|to fly|v
plavat|плавать|to swim|v
chitat|читать|to read|v
pisat|писать|to write|v
govorit|говорить|to speak|v
slushat|слушать|to listen|v
smotret|смотреть|to watch|v
videt|видеть|to see|v
znachit|значить|to mean|v
ponimat|понимать|to understand|v
pomnit|помнить|to remember|v
zabyvat|забывать|to forget|v
ljubit|любить|to love|v
nenavidet|ненавидеть|to hate|v
hotet|хотеть|to want|v
moch|мочь|to be able|v
dumat|думать|to think|v
skazat|сказать|to say|v
rasskazat|рассказать|to tell|v
sprosit|спросить|to ask|v
otvetit|ответить|to answer|v
molchat|молчать|to be silent|v
krichat|кричать|to shout|v
smejatsja|смеяться|to laugh|v
plakat|плакать|to cry|v
pet|петь|to sing|v
tantsevat|танцевать|to dance|v
risovat|рисовать|to draw|v
lepit|лепить|to sculpt|v
stroit|строить|to build|v
lomat|ломать|to break|v
chinit|чинить|to repair|v
kormit|кормить|to feed|v
vospitat|воспитывать|to raise|v
nosit|носить|to carry|v
otkryt|открыть|to open|v
zakryt|закрыть|to close|v
vkliuchit|включить|to turn on|v
vykliuchit|выключить|to turn off|v
platit|платить|to pay|v
pokupat|покупать|to buy|v
prodavat|продавать|to sell|v
menjat|менять|to change|v
davat|давать|to give|v
brat_v|брать|to take|v
poluchat|получать|to receive|v
otpravljat|отправлять|to send|v
zvonit|звонить|to call by phone|v
vstretit|встретить|to meet|v
proschatjsja|прощаться|to say goodbye|v
`;

const RAW_VERBS_MOTION = `
idti|идти|to go on foot|v
hodit|ходить|to walk around|v
ehat|ехать|to go by vehicle|v
ezdit|ездить|to travel by vehicle|v
prihodit|приходить|to arrive on foot|v
priehat|приехать|to arrive by transport|v
uhodit|уходить|to leave on foot|v
uezzhat|уезжать|to leave by transport|v
vhodit|входить|to enter|v
vyhodit|выходить|to exit|v
podnimatsja|подниматься|to go up|v
spuskatsja|спускаться|to go down|v
perehodit|переходить|to cross|v
povorachivat|поворачивать|to turn|v
ostanavlivatsja|останавливаться|to stop|v
nachinat|начинать|to begin|v
konchat|кончать|to finish|v
prodolzhat|продолжать|to continue|v
vozvraschatsja|возвращаться|to return|v
`;

const RAW_ADJ_QUALITY = `
bolshoj|большой|big|a
malenjkij|маленький|small|a
vysokij|высокий|tall|a
nizkij|низкий|low|a
shirokij|широкий|wide|a
uzkij|узкий|narrow|a
dlinnyj|длинный|long|a
korotkij|короткий|short|a
tjjolkyj|тёплый|warm|a
holodnyj|холодный|cold|a
gorjachij|горячий|hot|a
svetlyj|светлый|light|a
tjomnyj|тёмный|dark|a
novyj|новый|new|a
staryj|старый|old|a
chistyj|чистый|clean|a
grjaznyj|грязный|dirty|a
legkij|лёгкий|easy|a
tjazhelyj|тяжёлый|heavy|a
myagkij|мягкий|soft|a
tvjordyj|твёрдый|hard|a
krasivyj|красивый|beautiful|a
bezobraznyj|безобразный|ugly|a
bogatyj|богатый|rich|a
bednyj|бедный|poor|a
molodoj|молодой|young|a
pozhilogj|пожилой|elderly|a
silnyj|сильный|strong|a
slabyj|слабый|weak|a
bystryj|быстрый|fast|a
medlennyj|медленный|slow|a
glubokij|глубокий|deep|a
melkij|мелкий|shallow|a
gromkij|громкий|loud|a
tihij|тихий|quiet|a
jasnyj|ясный|clear|a
putanyj|путаный|confusing|a
`;

const RAW_ADJ_QUANTITY = `
mnogo|много|many|o
malo|мало|few|o
neskolko|несколько|several|o
ves|весь|whole|a
polnyj|полный|full|a
pustoj|пустой|empty|a
dostatochno|достаточно|enough|o
slishkom|слишком|too much|o
pochti|почти|almost|o
sovsem|совсем|completely|o
okolo|около|about|o
bolshe|больше|more|o
menshe|меньше|less|o
stolko|столько|that many|o
odin|один|one|a
dva_adj|два|two|a
tri_adj|три|three|a
chetyre_adj|четыре|four|a
pjat_adj|пять|five|a
shest_adj|шесть|six|a
sem_adj|семь|seven|a
vosem_adj|восемь|eight|a
devjat_adj|девять|nine|a
desjat_adj|десять|ten|a
odinadtsat|одиннадцать|eleven|a
dvenadtsat|двенадцать|twelve|a
poltora|полтора|one and a half|o
para|пара|pair|n
trojka|тройка|trio|n
chetverka|четвёрка|four of a kind|n
desjatok|десяток|ten items|n
sotnja|сотня|hundred|n
tysjacha|тысяча|thousand|n
million|миллион|million|n
`;

const verbs_common = parseCompactDeck('verbs_common', RAW_VERBS_COMMON);
const verbs_motion = parseCompactDeck('verbs_motion', RAW_VERBS_MOTION);
const adjectives_quality = parseCompactDeck('adjectives_quality', RAW_ADJ_QUALITY);
const adjectives_quantity = parseCompactDeck('adjectives_quantity', RAW_ADJ_QUANTITY);

const DECKS: Record<string, VocabEntry[]> = {
  verbs_common,
  verbs_motion,
  adjectives_quality,
  adjectives_quantity,
};

export function getVerbsAdjChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
