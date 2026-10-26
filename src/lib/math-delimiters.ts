/**
 * The page renders formulas written between dollar signs. Models often use the other LaTeX delimiters, \( ... \) and \[ ... \],
 * which would show as raw text. They are rewritten to $...$ and $$...$$; text with other content is not touched.
 */
export function normalizeMathDelimiters(text: string): string {
  if (!text || !/\\[()[\]]/.test(text)) return text;
  return text.replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `$$${body.trim()}$$`).replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
}
