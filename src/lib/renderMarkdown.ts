import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

marked.setOptions({ gfm: true, breaks: true });

const PURIFY = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'ul',
    'ol',
    'li',
    'a',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'blockquote',
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'rel', 'target'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Markdown → sanitized HTML for read-only display. Never trust raw HTML from users.
 */
export function renderSafeMarkdown(markdown: string): string {
  const raw = marked.parse(markdown || '', { async: false }) as string;
  return String(DOMPurify.sanitize(raw, PURIFY));
}
