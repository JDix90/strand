export type UserRole = 'teacher' | 'student' | 'admin';

/** Public registration only allows student or teacher. */
export type SignUpRole = Exclude<UserRole, 'admin'>;

export interface UserProfile {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
}

export type CaseId =
  | 'nominative'
  | 'genitive'
  | 'dative'
  | 'accusative'
  | 'instrumental'
  | 'prepositional';

export type PronounLemmaId = 'ya' | 'ty' | 'on' | 'ona' | 'ono' | 'my' | 'vy' | 'oni';

/** @deprecated Use string directly. Kept for backward compatibility. */
export type LemmaId = string;

export type WordCategory = 'pronoun' | 'name' | 'noun';

export type Gender = 'masculine' | 'feminine' | 'neuter';

export type Animacy = 'animate' | 'inanimate';

export type ModeId =
  | 'learn_table'
  | 'practice'
  | 'speed_round'
  | 'boss_battle'
  | 'memory_match'
  | 'grid_challenge';

export type DifficultyId = 'beginner' | 'standard' | 'advanced';

export type QuestionType =
  | 'multiple_choice'
  | 'case_identification'
  | 'grid_fill'
  | 'match_pair'
  | 'typed_input';

export interface DeclensionForm {
  lemmaId: string;
  lemmaDisplay: string;
  englishGloss: string;
  category: WordCategory;
  gender?: Gender;
  animacy?: Animacy;
  caseId: CaseId;
  surfaceForm: string;
  helperWord: string;
  questionPrompt: string;
  exampleSentence: string;
  notes?: string;
  afterPreposition?: boolean;
  acceptedVariants?: string[];
  postPrepositionForm?: string;
  postPrepositionVariants?: string[];
}

/** @deprecated Use DeclensionForm instead. */
export type PronounForm = DeclensionForm;

export interface DistractorRule {
  id: string;
  strategy:
    | 'same_lemma_other_case'
    | 'same_case_other_lemma'
    | 'confusion_pair'
    | 'near_neighbor';
  description: string;
}

export interface QuestionTemplate {
  id: string;
  type: QuestionType;
  modeIds: ModeId[];
  prompt: string;
  sentenceFrame?: string;
  targetCaseId: CaseId;
  targetLemmaId?: string;
  targetMeaning?: string;
  targetCategory?: WordCategory;
  helperWord: string;
  questionPrompt: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  distractors: string[];
  explanation: string;
  difficulty: DifficultyId;
  tags: string[];
}

export interface ConfusionPair {
  id: string;
  formA: string;
  formB: string;
  reason: string;
  targetCaseIds: CaseId[];
  targetLemmaIds: string[];
}

export interface SessionAnswerEvent {
  questionId: string;
  presentedAtMs: number;
  answeredAtMs: number;
  responseMs: number;
  selectedAnswer: string;
  correctAnswer: string;
  wasCorrect: boolean;
  targetCaseId: CaseId;
  targetLemmaId?: string;
  modeId: ModeId;
  usedHint: boolean;
}

export interface MasteryRecord {
  formKey: string;
  /** Scope for progress; defaults to seeded Russian core unit when omitted (local legacy). */
  unitId?: string;
  contentModule?: string;
  attempts: number;
  correct: number;
  lastSeenAt: string;
  lastCorrectAt?: string;
  easeScore: number;
  masteryScore: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  confusionWith: string[];
  status: 'unseen' | 'introduced' | 'shaky' | 'improving' | 'strong' | 'mastered';
}

export interface AdaptiveReviewQueueItem {
  formKey: string;
  /** When set, must match active unit for queue resolution. */
  unitId?: string;
  priorityScore: number;
  scheduledAfterQuestions: number;
  questionsSinceEnqueue: number;
  source: 'wrong_answer' | 'slow_correct' | 'confusion_pair' | 'mastery_gap' | 'stale_review';
}

export interface BossBattleConfig {
  startingHp: number;
  damageBase: number;
  damageStreakBonusPerStep: number;
  damageFastBonus: number;
  healOnWrong: number;
  shieldEveryRounds: number;
  shieldBase: number;
  weaknessCaseId?: CaseId;
  maxRounds: number;
}

export interface GridChallengeConfig {
  caseIds: CaseId[];
  lemmaIds: string[];
  cellMode: 'full_grid' | 'single_row' | 'single_column' | 'mixed_cells';
  timerSeconds?: number;
  hintsAllowed: number;
  instantCheck: boolean;
  instantCheckFeedbackStyle?: 'immediate_color' | 'subtle_icon';
}

export interface SessionSummary {
  id: string;
  modeId: ModeId;
  unitId?: string;
  topicId?: string;
  score: number;
  accuracy: number;
  averageResponseMs: number;
  totalQuestions: number;
  correctAnswers: number;
  bestStreak: number;
  weakForms: string[];
  confusionPairsHit: string[];
  completedAt: string;
  categories?: WordCategory[];
}

export interface CaseMetadata {
  id: CaseId;
  label: string;
  helperWord: string;
  questionPrompt: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: string;
}

export interface MatchCard {
  id: string;
  content: string;
  pairId: string;
  type: 'prompt' | 'answer';
  caseId?: CaseId;
}

export interface SentenceFrame {
  id: string;
  caseId: CaseId;
  frame: string;
  animacy: Animacy | 'any';
  helperWord: string;
  questionPrompt: string;
  explanation: string;
  difficulty: DifficultyId;
  requiresPreposition?: boolean;
}
