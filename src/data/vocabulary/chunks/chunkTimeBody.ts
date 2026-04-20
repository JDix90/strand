import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_CLOCK = `
chas|час|hour|n
minuta|минута|minute|n
sekunda|секунда|second|n
moment|момент|moment|n
vremja|время|time|n
rano_adv|рано|early|o
pozdno_adv|поздно|late|o
vsegda|всегда|always|o
nikogda|никогда|never|o
chasto|часто|often|o
redko|редко|rarely|o
inogda|иногда|sometimes|o
sejchas|сейчас|now|o
potom|потом|later|o
skoro|скоро|soon|o
davno|давно|long ago|o
nedavno|недавно|recently|o
segodnja|сегодня|today|o
vchera|вчера|yesterday|o
zavtra|завтра|tomorrow|o
utrom|утром|in the morning|o
dnem|днём|in the afternoon|o
vecherom|вечером|in the evening|o
nochju|ночью|at night|o
skolko|сколько|how much|o
`;

const RAW_CALENDAR = `
ponedelnik|понедельник|Monday|n
vtornik|вторник|Tuesday|n
sreda|среда|Wednesday|n
chetverg|четверг|Thursday|n
pjatnitsa|пятница|Friday|n
subbota|суббота|Saturday|n
voskresenje|воскресенье|Sunday|n
nedelja_cal|неделя|week|n
mesjats|месяц|month|n
god|год|year|n
data|дата|date|n
chislo|число|day of month|n
prazdnik|праздник|holiday|n
den_rozhdenija|день рождения|birthday|n
novyj_god|Новый год|New Year|n
rozhdestvo|Рождество|Christmas|n
pascha|Пасха|Easter|n
kanikuly|каникулы|vacation break|n
rabochij_den|рабочий день|workday|n
vyhodnoj|выходной|day off|n
ponedelnik_sokr|пн|Mon abbrev|n
vtornik_sokr|вт|Tue abbrev|n
sreda_sokr|ср|Wed abbrev|n
chetver_sokr|чт|Thu abbrev|n
pjatnitsa_sokr|пт|Fri abbrev|n
subbota_sokr|сб|Sat abbrev|n
voskresenje_sokr|вс|Sun abbrev|n
kvartal|квартал|quarter year|n
polugodie|полугодие|half-year|n
dekada|декада|ten-day period|n
vechnost|вечность|eternity|n
mgnovenije|мгновение|instant|n
sekundomer|секундомер|stopwatch|n
budilnik|будильник|alarm clock|n
chasovy_pojas|часовой пояс|time zone|n
pauza|пауза|pause|n
pereryv|перерыв|break|n
srok_godnosti|срок годности|expiry date|n
`;

const RAW_BODY = `
golova|голова|head|n
volosy|волосы|hair|n
litso|лицо|face|n
glaz|глаз|eye|n
ukho|ухо|ear|n
nos|нос|nose|n
rot|рот|mouth|n
zuby|зубы|teeth|n
jazyk|язык|tongue|n
sheja|шея|neck|n
plecho|плечо|shoulder|n
ruka|рука|arm|n
kist|кисть|hand|n
palets|палец|finger|n
grud|грудь|chest|n
spina|спина|back|n
zhivot|живот|belly|n
noga|нога|leg|n
koleno|колено|knee|n
stopa|ступня|foot|n
serdtse|сердце|heart|n
legkije|лёгкие|lungs|n
zheludok|желудок|stomach|n
pechen|печень|liver|n
krov|кровь|blood|n
kost|кость|bone|n
myshtsy|мышцы|muscles|n
`;

const RAW_HEALTH = `
bolnitsa|больница|hospital|n
poliklinika|поликлиника|clinic|n
vrach_health|врач|doctor|n
medsestra|медсестра|nurse|n
lekarstvo|лекарство|medicine|n
tabletka|таблетка|pill|n
ukol|укол|injection|n
operatsija|операция|operation|n
bolezn|болезнь|illness|n
prostuda|простуда|cold|n
gripp|грипп|flu|n
kashlj|кашель|cough|n
temperatura_telo|температура|fever|n
bol|боль|pain|n
zdorovje|здоровье|health|n
dieta|диета|diet|n
pokoj|покой|rest|n
vizov_skoroj|вызов скорой|ambulance call|n
anamnez|анамнез|medical history|n
simptom|симптом|symptom|n
diagnostika|диагностика|diagnostics|n
rentgen|рентген|X-ray|n
uzi|УЗИ|ultrasound|n
krov_test|анализ крови|blood test|n
gips|гипс|cast|n
shov|шов|stitch|n
bandazh|бандаж|bandage|n
vitaminy|витамины|vitamins|n
immunitet|иммунитет|immunity|n
allergija|аллергия|allergy|n
astma|астма|asthma|n
diabet|диабет|diabetes|n
davlenije|давление|blood pressure|n
puls|пульс|pulse|n
`;

const time_clock = parseCompactDeck('time_clock', RAW_CLOCK);
const time_calendar = parseCompactDeck('time_calendar', RAW_CALENDAR);
const body_parts = parseCompactDeck('body_parts', RAW_BODY);
const body_health = parseCompactDeck('body_health', RAW_HEALTH);

const DECKS: Record<string, VocabEntry[]> = {
  time_clock,
  time_calendar,
  body_parts,
  body_health,
};

export function getTimeBodyChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
