/**
 * Models sometimes write a choice such as `4\pi cm` with LaTeX commands but no `$`, so the page would show the backslash.
 * Text that already has `$` is left alone. A short text becomes one formula with plain words as \text{...};
 * a sentence only has its command-bearing tokens wrapped, so ordinary words stay ordinary.
 */
export function wrapBareLatex(text: string): string {
  if (!text || text.includes('$') || !/\\[A-Za-z]+/.test(text)) return text;
  const words = text.replace(/\\[A-Za-z]+/g, ' ').match(/[A-Za-zÀ-ỹ]{2,}/g) ?? [];
  if (words.length >= 3) return text.replace(/\S*\\[A-Za-z]+\S*/g, token => `$${token}$`);
  return `$${text.replace(/(\\[A-Za-z]+)|([A-Za-zÀ-ỹ]{2,})/g, (_, command: string | undefined, word: string | undefined) => command ?? `\\text{${word}}`)}$`;
}
