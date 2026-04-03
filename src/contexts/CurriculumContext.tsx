import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CaseId, WordCategory } from '../types';
import { DEFAULT_RUSSIAN_UNIT_ID } from '../lib/curriculumConstants';
import { parseRussianDeclensionConfig, isRussianDeclensionModule } from '../lib/contentModules';
import { fetchUnitById, type UnitRow } from '../lib/curriculumApi';
import { useGameStore } from '../store/gameStore';

export interface CurriculumContextValue {
  classId: string | null;
  unitId: string | null;
  topicId: string | null;
  unitRow: UnitRow | null;
  loading: boolean;
  /** Russian declension filters from unit, or full catalog when unscoped. */
  effectiveCategories: WordCategory[];
  filterCaseIds: CaseId[] | undefined;
  contentModule: string;
  setScope: (classId: string | null, unitId: string | null, topicId?: string | null) => void;
  refreshUnit: () => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const settings = useGameStore(s => s.settings);
  const [classId, setClassId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [unitRow, setUnitRow] = useState<UnitRow | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUnit = useCallback(async (id: string | null) => {
    if (!id) {
      setUnitRow(null);
      return;
    }
    setLoading(true);
    try {
      const row = await fetchUnitById(id);
      setUnitRow(row);
      if (row) setTopicId(row.topic_id);
    } finally {
      setLoading(false);
    }
  }, []);

  const setScope = useCallback(
    (nextClassId: string | null, nextUnitId: string | null, nextTopicId?: string | null) => {
      setClassId(nextClassId);
      setUnitId(nextUnitId);
      if (nextTopicId !== undefined) setTopicId(nextTopicId);
    },
    []
  );

  useEffect(() => {
    void loadUnit(unitId);
  }, [unitId, loadUnit]);

  const contentModule = unitRow?.content_module ?? 'russian_declension';

  const { effectiveCategories, filterCaseIds } = useMemo(() => {
    if (unitRow && isRussianDeclensionModule(contentModule)) {
      const cfg = parseRussianDeclensionConfig(unitRow.content_config);
      return {
        effectiveCategories: cfg.categories,
        filterCaseIds: cfg.caseIds.length > 0 ? cfg.caseIds : undefined,
      };
    }
    return {
      effectiveCategories:
        settings.activeCategories.length > 0 ? settings.activeCategories : (['pronoun'] as WordCategory[]),
      filterCaseIds: undefined,
    };
  }, [unitRow, contentModule, settings.activeCategories]);

  const value = useMemo<CurriculumContextValue>(
    () => ({
      classId,
      unitId,
      topicId,
      unitRow,
      loading,
      effectiveCategories,
      filterCaseIds,
      contentModule,
      setScope,
      refreshUnit: () => loadUnit(unitId),
    }),
    [
      classId,
      unitId,
      topicId,
      unitRow,
      loading,
      effectiveCategories,
      filterCaseIds,
      contentModule,
      setScope,
      loadUnit,
    ]
  );

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  const settings = useGameStore(s => s.settings);
  if (!ctx) {
    const cats =
      settings.activeCategories.length > 0 ? settings.activeCategories : (['pronoun'] as WordCategory[]);
    return {
      classId: null,
      unitId: null,
      topicId: null,
      unitRow: null,
      loading: false,
      effectiveCategories: cats,
      filterCaseIds: undefined,
      contentModule: 'russian_declension',
      setScope: () => {},
      refreshUnit: async () => {},
    };
  }
  return ctx;
}

/** Active unit for mastery + adaptive queue (defaults to seeded Russian core). */
export function useEffectiveUnitId(): string {
  const { unitId } = useCurriculum();
  return unitId ?? DEFAULT_RUSSIAN_UNIT_ID;
}
