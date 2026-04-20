import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_WORK = `
rabota|работа|work|n
ofis|офис|office|n
soveschanije|совещание|meeting|n
proekt|проект|project|n
zadacha|задача|task|n
otchjot|отчёт|report|n
pismo_sluzhebnoe|письмо|letter|n
pochta_rab|почта|mail|n
komputer_rab|компьютер|computer|n
printer|принтер|printer|n
kseroks|ксерокс|copier|n
buhgalterija|бухгалтерия|accounting|n
zarplata|зарплата|salary|n
premija|премия|bonus|n
otpusk_rab|отпуск|leave|n
kollega|коллега|colleague|n
nachalnik|начальник|boss|n
podchinjonnyj|подчинённый|subordinate|n
sobesedovanije|собеседование|interview|n
grafik|график|schedule|n
srok|срок|deadline|n
dogovor|договор|contract|n
podpis|подпись|signature|n
pechat|печать|stamp|n
`;

const RAW_CITY = `
ulitsa_gor|улица|street|n
ploschad_gor|площадь|square|n
most_gor|мост|bridge|n
park_gor|парк|park|n
magazin_gor|магазин|store|n
rynok|рынок|market|n
apteka_gor|аптека|pharmacy|n
bank_gor|банк|bank|n
pochta_gor|почта|post office|n
metro_gor|метро|metro|n
ostanovka_gor|остановка|bus stop|n
svetofor_gor|светофор|traffic light|n
perehod|переход|crosswalk|n
doroga_gor|дорога|road|n
karta_gor|карта|map|n
sever|север|north|n
jug|юг|south|n
vostok|восток|east|n
zapad|запад|west|n
napravo|направо|to the right|o
nalevo|налево|to the left|o
pryamo|прямо|straight ahead|o
blizko|близко|near|o
daleko|далеко|far|o
`;

const RAW_SHOP = `
tsena|цена|price|n
skidka|скидка|discount|n
chek|чек|receipt|n
kassa|касса|checkout|n
korzina_mag|корзина|shopping basket|n
tovar|товар|goods|n
odezhda|одежда|clothing|n
rubashka|рубашка|shirt|n
brjuki|брюки|trousers|n
platje|платье|dress|n
kurtka|куртка|jacket|n
palto|пальто|coat|n
obuv|обувь|footwear|n
sapogi|сапоги|boots|n
krossovki|кроссовки|sneakers|n
shapka|шапка|hat|n
perchatki|перчатки|gloves|n
sharf|шарф|scarf|n
sumka|сумка|bag|n
koshelek|кошелёк|wallet|n
den_gi_mag|деньги|money|n
karta_oplaty|карта оплаты|payment card|n
ochered|очередь|queue|n
skidka_den|скидка|discount|n
rasprodazha|распродажа|sale|n
vitrina|витрина|display window|n
pokupatel|покупатель|shopper|n
prodavshchitsa|продавщица|saleswoman|n
razmer|размер|size|n
primerochnaja|примерочная|fitting room|n
kassa_self|касса самообслуживания|self checkout|n
korzina_pokup|тележка для покупок|shopping cart|n
paket_plastik|пакет|plastic bag|n
chek_mag|чек|receipt|n
nalichnye|наличные|cash|n
sdacha|сдача|change money|n
`;

const RAW_SCHOOL = `
shkola|школа|school|n
universitet|университет|university|n
klass|класс|classroom|n
urok|урок|lesson|n
domashnee_zadanije|домашнее задание|homework|n
ekzamen|экзамен|exam|n
otsenka|оценка|grade|n
uchebnik|учебник|textbook|n
tetrad|тетрадь|notebook|n
ruchka_shk|ручка|pen|n
karandash|карандаш|pencil|n
lastik|ластик|eraser|n
linejka|линейка|ruler|n
doska_shk|доска|blackboard|n
mel|мел|chalk|n
uchitel_shk|учитель|teacher|n
uchenik|ученик|pupil|n
student_shk|студент|student|n
lektor|лектор|lecturer|n
zachet|зачёт|pass grade|n
`;

const RAW_TECH = `
internet|интернет|internet|n
sajt|сайт|website|n
parol|пароль|password|n
login|логин|login|n
prilozhenije|приложение|app|n
smartfon|смартфон|smartphone|n
noutbuk|ноутбук|laptop|n
planshet|планшет|tablet|n
naushniki|наушники|headphones|n
kamera|камера|camera|n
zariadka|зарядка|charger|n
dannye|данные|data|n
fail|файл|file|n
papka|папка|folder|n
pochta_elektronnaja|электронная почта|email|n
soobschenije|сообщение|message|n
zvonok|звонок|call|n
videozvonok|видеозвонок|video call|n
oblako_dannye|облако|cloud storage|n
server|сервер|server|n
router|роутер|router|n
kabel|кабель|cable|n
bluetooth|блютуз|Bluetooth|n
usb|ЮСБ|USB|n
zhestkij_disk|жёсткий диск|hard drive|n
operatsionnaja_sistema|операционная система|operating system|n
brauzer|браузер|browser|n
zakladka|закладка|bookmark|n
parol_admin|пароль администратора|admin password|n
virus|вирус|virus|n
antivirus|антивирус|antivirus|n
obnovlenije|обновление|update|n
zagruzka|загрузка|download|n
otpravka_faila|отправка файла|file upload|n
`;

const work_office = parseCompactDeck('work_office', RAW_WORK);
const city_urban = parseCompactDeck('city_urban', RAW_CITY);
const shopping_general = parseCompactDeck('shopping_general', RAW_SHOP);
const school_learning = parseCompactDeck('school_learning', RAW_SCHOOL);
const technology_digital = parseCompactDeck('technology_digital', RAW_TECH);

const DECKS: Record<string, VocabEntry[]> = {
  work_office,
  city_urban,
  shopping_general,
  school_learning,
  technology_digital,
};

export function getWorkUrbanChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
