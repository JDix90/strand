import type { GeneratedQuestion } from '../../lib/questionGenerator';
import { CaseBadge } from '../ui/CaseBadge';

interface QuestionCardProps {
  question: GeneratedQuestion;
  showHelper?: boolean;
}

export function QuestionCard({ question, showHelper = true }: QuestionCardProps) {
  const { template } = question;

  // Split prompt on ___ to highlight the blank
  const parts = template.prompt.split('___');

  return (
    <div className="bg-surface rounded-2xl border border-border-strong p-6 space-y-4">
      <div className="flex items-center justify-between">
        <CaseBadge caseId={template.targetCaseId} />
        {showHelper && (
          <span className="text-ink-secondary text-sm">
            Helper: <span className="text-ink font-semibold">{template.helperWord}</span>
          </span>
        )}
      </div>

      <div className="text-center py-4">
        <p className="text-3xl font-bold text-ink leading-relaxed">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span className="inline-block border-b-2 border-brand min-w-[80px] mx-1 text-brand">
                  ___
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {template.targetMeaning && (
        <p className="text-center text-ink-secondary text-sm italic">
          ({template.targetMeaning})
        </p>
      )}
    </div>
  );
}
