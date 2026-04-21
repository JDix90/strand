import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

/**
 * Color + noun inside short realistic sentences; adjectives agree in case with their nouns.
 * English is a natural sentence gloss (not word-for-word where that would sound odd).
 * Compact `pos` uses `o` (other) — full sentence as one lemma unit.
 */
const RAW_COLORS_CASE_SENTENCES = `
colcs_acc_kup_rub|Я купил синюю рубашку.|I bought a blue shirt.|o
colcs_gen_net_sum|У меня нет красной сумки.|I don't have a red bag.|o
colcs_ins_ruchk|Она пишет чёрной ручкой.|She writes with a black pen.|o
colcs_prep_o_more|Мы говорим о синем море.|We're talking about the blue sea.|o
colcs_prep_na_stol|Яблоко лежит на зелёном столе.|The apple is on the green table.|o
colcs_acc_vid_mash|Он видит жёлтую машину.|He sees a yellow car.|o
colcs_gen_dlja_kosh|Подарок для чёрной кошки уже здесь.|The gift for the black cat is already here.|o
colcs_ins_s_zont|Она пришла с красным зонтом.|She came with a red umbrella.|o
colcs_gen_u_okna|Кот сидит у белого окна.|The cat sits by the white window.|o
colcs_prep_v_komn|В чёрной комнате темно.|It's dark in the black room.|o
colcs_acc_post_dom|Они построили серый дом.|They built a gray house.|o
colcs_prep_pod_dub|Под зелёным дубом мы отдохнули.|We rested under the green oak.|o
colcs_gen_bez_shap|Мне холодно без оранжевой шапки.|I'm cold without an orange hat.|o
colcs_acc_vzal_igr|Он взял розовую игрушку.|He took a pink toy.|o
colcs_prep_nad_krov|Картина висит над серой кроватью.|The picture hangs above the gray bed.|o
colcs_dat_podar_brat|Я подарил брату жёлтый шарф.|I gave my brother a yellow scarf.|o
colcs_prep_po_nab|Мы шли по оранжевой набережной.|We walked along the orange embankment.|o
colcs_prep_o_roze|Она думает о красной розе.|She's thinking about a red rose.|o
colcs_gen_iz_zdan|Из белого здания вышли люди.|People came out of the white building.|o
colcs_acc_vid_nebo|Я вижу голубое небо.|I see the light blue sky.|o
colcs_prep_v_trav|В зелёной траве сидела жаба.|A frog sat in the green grass.|o
colcs_ins_uprav_mash|Он управляет чёрной машиной.|He's driving a black car.|o
colcs_ins_s_oboy|С жёлтыми обоями трудно жить.|It's hard to live with yellow wallpaper.|o
colcs_acc_zakaz_kof|Я заказал чёрный кофе.|I ordered black coffee.|o
colcs_gen_u_mosta|Мы встретились у серого моста.|We met by the gray bridge.|o
colcs_dat_k_dom|К чёрному дому ведёт тропинка.|A path leads to the black house.|o
colcs_gen_iz_lesa|Из зелёного леса доносится пение.|Singing carries from the green forest.|o
colcs_prep_po_dor|По белой дороге ехали гости.|Guests drove along the white road.|o
colcs_gen_bez_pal|Без коричневого пальто я замёрзну.|I'll freeze without a brown coat.|o
colcs_prep_na_skam|На жёлтой скамейке сидел мальчик.|A boy sat on the yellow bench.|o
colcs_acc_pro_kuk|Вечером рассказали про розовую куклу.|In the evening they told about a pink doll.|o
colcs_prep_fiolet_gor|Над фиолетовыми горами плыли облака.|Clouds floated above the purple mountains.|o
colcs_ins_tusk_lamp|Комната освещалась тускло-жёлтой лампой.|The room was lit by a dim yellow lamp.|o
colcs_gen_posle_dozh|После серого дождя вышло солнце.|The sun came out after the gray rain.|o
colcs_acc_nashli_klj|Они нашли коричневый ключ.|They found a brown key.|o
`;

const colors_case_sentences = parseCompactDeck('colors_case_sentences', RAW_COLORS_CASE_SENTENCES);

const DECKS: Record<string, VocabEntry[]> = {
  colors_case_sentences,
};

export function getColorsCasesChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
