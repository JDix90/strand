import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_FAMILY = `
mat|мать|mother|n
otets|отец|father|n
syn|сын|son|n
doch|дочь|daughter|n
brat_people|брат|brother|n
sestra_people|сестра|sister|n
babushka|бабушка|grandmother|n
dedushka|дедушка|grandfather|n
vnuk|внук|grandson|n
vnuchka|внучка|granddaughter|n
tjotja|тётя|aunt|n
djadja|дядя|uncle|n
plemjannik|племянник|nephew|n
plemjannitsa|племянница|niece|n
svjokor|свёкор|father-in-law|n
svekrov|свекровь|mother-in-law|n
zjat|зять|son-in-law|n
nevestka|невестка|daughter-in-law|n
zhenih|жених|fiancé|n
nevesta|невеста|bride|n
suprug|супруг|husband|n
supruga|супруга|wife|n
rebenok|ребёнок|child|n
mladenets|младенец|infant|n
podrostok|подросток|teenager|n
prababushka|прабабушка|great-grandmother|n
pradedushka|прадедушка|great-grandfather|n
svjokrov|свёкр|father-in-law of wife|n
test|тесть|father-in-law of husband|n
zolovka|золовка|husband sister|n
devjer|деверь|husband brother|n
svojak|свояк|wife brother|n
snoha|сноха|daughter-in-law|n
ziat|зять|son-in-law|n
kusina|кузина|female cousin|n
dvojurodnaja_sestra|двоюродная сестра|cousin|n
dvojurodnij_brat|двоюродный брат|male cousin|n
shurin|шурин|wife brother|n
svojachenitsa|свояченица|cousin by marriage|n
kum|кум|godfather|n
kuma|кума|godmother|n
krestnik|крестник|godson|n
krestnitsa|крестница|goddaughter|n
naslednik|наследник|heir|n
sirot|сирота|orphan|n
`;

const RAW_ROLES = `
uchitel_role|учитель|teacher|n
vrach_role|врач|doctor|n
inzhener|инженер|engineer|n
jurist_role|юрист|lawyer|n
prodavets|продавец|salesperson|n
voditel_role|водитель|driver|n
povar_role|повар|cook|n
ofitsiant_role|официант|waiter|n
politsejskij|полицейский|police officer|n
pozharnyj|пожарный|firefighter|n
stroitel_role|строитель|builder|n
hudozhnik|художник|artist|n
muzykant|музыкант|musician|n
pisatel_role|писатель|writer|n
akter_role|актёр|actor|n
rezhissjor|режиссёр|director|n
buhgalter|бухгалтер|accountant|n
menedzher_role|менеджер|manager|n
sekretar|секретарь|secretary|n
direktor_role|директор|director|n
rabochij|рабочий|worker|n
fermer|фермер|farmer|n
uchenyj_role|учёный|scientist|n
`;

const RAW_TRAITS = `
radostnyj|радостный|joyful|a
grustnyj|грустный|sad|a
zlyj|злой|angry|a
dobryj|добрый|kind|a
umnyj|умный|smart|a
glupyj|глупый|foolish|a
smelyj|смелый|brave|a
robkij|робкий|shy|a
ustalyj|усталый|tired|a
bodryj|бодрый|cheerful|a
spokojnyj|спокойный|calm|a
nervnyj|нервный|nervous|a
schastlivyj|счастливый|happy|a
neschastnyj|несчастный|unhappy|a
ljubopytnyj|любопытный|curious|a
ravnodushnyj|равнодушный|indifferent|a
veselyj|весёлый|merry|a
serjoznyj|серьёзный|serious|a
druzhnyj|дружный|friendly|a
vrazhdebnyj|враждебный|hostile|a
rad|рад|glad|a
ogorchen|огорчён|upset|a
ispugan|испуган|scared|a
`;

const people_family = parseCompactDeck('people_family', RAW_FAMILY);
const people_roles = parseCompactDeck('people_roles', RAW_ROLES);
const people_traits = parseCompactDeck('people_traits', RAW_TRAITS);

const DECKS: Record<string, VocabEntry[]> = {
  people_family,
  people_roles,
  people_traits,
};

export function getPeopleChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
