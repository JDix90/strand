import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

const RAW_TRANSPORT = `
poezd|поезд|train|n
avtobus|автобус|bus|n
tramvaj|трамвай|tram|n
marshrutka|маршрутка|minibus|n
taksi|такси|taxi|n
metro|метро|metro|n
samoljot|самолёт|airplane|n
vertolet|вертолёт|helicopter|n
korabl|корабль|ship|n
parom|паром|ferry|n
velosiped|велосипед|bicycle|n
motocikl|мотоцикл|motorcycle|n
mashina|машина|car|n
gruzovik|грузовик|truck|n
bilet|билет|ticket|n
pasport|паспорт|passport|n
vizy|виза|visa|n
bagazh|багаж|luggage|n
chemodan|чемодан|suitcase|n
rjukzak|рюкзак|backpack|n
karta|карта|map|n
marshrut|маршрут|route|n
ostanovka|остановка|stop|n
vokzal|вокзал|station|n
aeroport|аэропорт|airport|n
pristan|пристань|pier|n
doroga|дорога|road|n
most|мост|bridge|n
tunnel|туннель|tunnel|n
svetofor|светофор|traffic light|n
benzin|бензин|gasoline|n
zapravka|заправка|gas station|n
parkovka|парковка|parking|n
voditelskie_prava|водительские права|driver license|n
elektrichka|электричка|commuter train|n
skorostnoj_poezd|скоростной поезд|high-speed train|n
vagon|вагон|railway car|n
kupe|купе|compartment|n
platskart|плацкарт|open sleeping car|n
stjuardessa|стюардесса|flight attendant|n
pilot_sam|пилот|pilot|n
bortprovodnik|бортпроводник|flight attendant|n
rejjs|рейс|flight|n
vylet|вылет|departure|n
prilet|прилёт|arrival|n
pasportnyj_kontrol|паспортный контроль|passport control|n
bagazhnaja_lenta|багажная лента|baggage carousel|n
kamera_bagazh|камера хранения|left luggage lockers|n
kassa_bilet|касса|ticket office|n
raspisanije|расписание|timetable|n
opozdanije|опоздание|delay|n
perehod_metro|пересадка|transfer|n
turniket|турникет|turnstile|n
`;

const RAW_PLACES = `
otel|отель|hotel|n
hostel|хостел|hostel|n
muzej|музей|museum|n
teatr|театр|theater|n
kinoteatr|кинотеатр|cinema|n
park|парк|park|n
ploschad|площадь|square|n
ulica|улица|street|n
dostoprimechatelnost|достопримечательность|sight|n
pamjatnik|памятник|monument|n
sobor|собор|cathedral|n
kreml|кремль|kremlin|n
zamok|замок|castle|n
derevnja|деревня|village|n
gorod|город|city|n
stolica|столица|capital|n
granica|граница|border|n
tamozhnja|таможня|customs|n
pogranichnik|пограничник|border guard|n
ekskursija|экскурсия|excursion|n
gid|гид|guide|n
turist|турист|tourist|n
puteshestvie|путешествие|trip|n
otpusk|отпуск|vacation|n
komandirovka|командировка|business trip|n
bereg|берег|shore|n
more|море|sea|n
ozero|озеро|lake|n
reka|река|river|n
gora|гора|mountain|n
les|лес|forest|n
pole|поле|field|n
ostrov|остров|island|n
kanal|канал|canal|n
fontan|фонтан|fountain|n
bashnja|башня|tower|n
dvorets|дворец|palace|n
hram|храм|temple|n
chasovnja|часовня|chapel|n
monastyr|монастырь|monastery|n
kladbische|кладбище|cemetery|n
stadion|стадион|stadium|n
bassejn|бассейн|swimming pool|n
kinoteatr_imax|кинотеатр IMAX|IMAX theater|n
biblioteka_publ|публичная библиотека|public library|n
`;

const RAW_LODGING = `
gostinitsa|гостиница|inn|n
registratsija|регистрация|check-in|n
kljuch|ключ|key|n
nomer_komnaty|номер комнаты|room number|n
ljuks|люкс|suite|n
odnomestnyj_nomer|одноместный номер|single room|n
dvuhmestnyj_nomer|двухместный номер|double room|n
zavtrak_vkljuchen|завтрак включён|breakfast included|n
wifi|вай-фай|Wi-Fi|n
konditsioner|кондиционер|air conditioning|n
otmena|отмена|cancellation|n
bronirovanie|бронирование|booking|n
svobodnye_mesta|свободные места|availability|n
kurort|курорт|resort|n
sanatorij|санаторий|sanatorium|n
kemping|кемпинг|camping|n
palatka|палатка|tent|n
spalnik|спальник|sleeping bag|n
polotentse|полотенце|towel|n
mylo|мыло|soap|n
dush|душ|shower|n
vanna|ванна|bathtub|n
krovat|кровать|bed|n
podushka|подушка|pillow|n
odejalo|одеяло|blanket|n
shtory|шторы|curtains|n
lampochka|лампочка|light bulb|n
rozetka|розетка|socket|n
lift|лифт|elevator|n
lestnitsa|лестница|stairs|n
etazh|этаж|floor|n
vestibjul|вестибюль|lobby|n
konsjerzh|консьерж|concierge|n
bagazhnaja_kamera|багажная камера|left luggage|n
`;


const travel_transport = parseCompactDeck('travel_transport', RAW_TRANSPORT);
const travel_places = parseCompactDeck('travel_places', RAW_PLACES);
const travel_lodging = parseCompactDeck('travel_lodging', RAW_LODGING);

const DECKS: Record<string, VocabEntry[]> = {
  travel_transport,
  travel_places,
  travel_lodging,
};

export function getTravelChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
