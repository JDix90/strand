import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FeedbackPanel } from './FeedbackPanel';

describe('FeedbackPanel', () => {
  it('renders zero millisecond response times instead of hiding them', () => {
    const html = renderToStaticMarkup(
      <FeedbackPanel
        isCorrect
        selectedAnswer="тебя"
        correctAnswer="тебя"
        sentencePrompt="Я вижу ___."
        explanation="Accusative form."
        onContinue={() => {}}
        responseMs={0}
      />,
    );

    expect(html).toContain('0.0s');
  });
});
