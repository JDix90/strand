import type { VocabEntry } from '../types';
import { parseCompactDeck } from '../parseCompact';

/**
 * Color + noun phrases (nominative). Russian adjective agrees with noun gender/number;
 * English gloss is natural "color + noun" (not bare color words).
 */
const RAW_COLORS_NOUNS = `
coln_kras_stol|красный стол|red table|n
coln_sin_mash|синяя машина|blue car|n
coln_zel_jabl|зелёное яблоко|green apple|n
coln_chern_tel|чёрный телефон|black phone|n
coln_bel_dom|белый дом|white house|n
coln_zhel_rub|жёлтая рубашка|yellow shirt|n
coln_oran_kurt|оранжевая куртка|orange jacket|n
coln_kor_sum|коричневая сумка|brown bag|n
coln_roz_tuf|розовые туфли|pink shoes|n
coln_fiol_plat|фиолетовое платье|purple dress|n
coln_gol_nebo|голубое небо|light blue sky|n
coln_ser_ruk|серый рюкзак|gray backpack|n
coln_chern_och|чёрные очки|black glasses|n
coln_bel_chul|белые чулки|white tights|n
coln_kras_jabl|красные яблоки|red apples|n
coln_sin_more|синее море|blue sea|n
coln_zel_dver|зелёная дверь|green door|n
coln_zhel_lamp|жёлтая лампа|yellow lamp|n
coln_chern_kosh|чёрная кошка|black cat|n
coln_bel_okno|белое окно|white window|n
coln_ser_zdan|серое здание|gray building|n
coln_oran_zont|оранжевый зонт|orange umbrella|n
coln_kor_stul|коричневый стул|brown chair|n
coln_roz_vaza|розовая ваза|pink vase|n
coln_fiol_cv|фиолетовый цветок|purple flower|n
coln_kras_roza|красная роза|red rose|n
coln_sin_jub|синяя юбка|blue skirt|n
coln_zel_trav|зелёная трава|green grass|n
coln_zhel_sol|жёлтое солнце|yellow sun|n
coln_chern_chaj|чёрный чай|black tea|n
coln_bel_sneg|белый снег|white snow|n
coln_ser_kot|серый кот|gray cat|n
coln_kras_mash|красная машина|red car|n
coln_sin_stul|синий стул|blue chair|n
coln_zel_dub|зелёный дуб|green oak|n
coln_zhel_bus|жёлтый автобус|yellow bus|n
coln_bel_rub|белая рубашка|white shirt|n
coln_chern_sum|чёрная сумка|black bag|n
`;

const colors_nouns = parseCompactDeck('colors_nouns', RAW_COLORS_NOUNS);

const DECKS: Record<string, VocabEntry[]> = {
  colors_nouns,
};

export function getColorsChunkDeck(vocabularySetId: string): VocabEntry[] | undefined {
  return DECKS[vocabularySetId];
}
