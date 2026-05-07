import { performance } from 'node:perf_hooks';
import { generateQuestion } from '../src/lib/questionGenerator';
import { caseOrder } from '../src/data/caseMetadata';
import type { CaseId, WordCategory } from '../src/types';
import { allForms } from '../src/data/allForms';
import { questionTemplates } from '../src/data/questionTemplates';

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx]!;
}

function runGenerationBench(): { medianMs: number; p95Ms: number; totalMs: number; count: number } {
  const categories: WordCategory[] = ['pronoun', 'name', 'noun'];
  const durations: number[] = [];
  const iterations = 5000;

  for (let i = 0; i < iterations; i += 1) {
    const caseId = caseOrder[i % caseOrder.length] as CaseId;
    const category = categories[i % categories.length] as WordCategory;
    const t0 = performance.now();
    generateQuestion('practice', 'standard', [caseId], [], undefined, [category]);
    durations.push(performance.now() - t0);
  }

  durations.sort((a, b) => a - b);
  const totalMs = durations.reduce((acc, d) => acc + d, 0);
  return {
    medianMs: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    totalMs,
    count: durations.length,
  };
}

function jsonBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function main() {
  const gen = runGenerationBench();
  const sampleMastery = Object.fromEntries(
    allForms.slice(0, 300).map((f, i) => [
      `${f.lemmaId}:${f.caseId}`,
      {
        formKey: `${f.lemmaId}:${f.caseId}`,
        attempts: i + 1,
        correct: Math.floor((i + 1) * 0.7),
        lastSeenAt: new Date().toISOString(),
        easeScore: 1.25,
        masteryScore: 55,
        consecutiveCorrect: 1,
        consecutiveWrong: 0,
        confusionWith: [],
        status: 'improving',
      },
    ]),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    dataScale: {
      allForms: allForms.length,
      questionTemplates: questionTemplates.length,
      sampleMasteryRecords: Object.keys(sampleMastery).length,
    },
    generation: {
      iterations: gen.count,
      medianMs: Number(gen.medianMs.toFixed(4)),
      p95Ms: Number(gen.p95Ms.toFixed(4)),
      totalMs: Number(gen.totalMs.toFixed(2)),
    },
    persistenceEstimate: {
      sampleMasteryJsonBytes: jsonBytes(sampleMastery),
      sampleMasteryJsonKb: Number((jsonBytes(sampleMastery) / 1024).toFixed(2)),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
