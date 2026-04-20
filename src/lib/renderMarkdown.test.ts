import { describe, it, expect } from 'vitest';
import { renderSafeMarkdown } from './renderMarkdown';

describe('renderSafeMarkdown', () => {
  it('renders bold', () => {
    const html = renderSafeMarkdown('**hi**');
    expect(html).toContain('strong');
    expect(html).toContain('hi');
  });

  it('strips script tags', () => {
    const html = renderSafeMarkdown('Hello<script>alert(1)</script>');
    expect(html.toLowerCase()).not.toContain('script');
  });

  it('strips onerror handlers in raw HTML', () => {
    const html = renderSafeMarkdown('<img src=x onerror=alert(1)>');
    expect(html.toLowerCase()).not.toContain('onerror');
  });
});
