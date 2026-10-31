import { foldText, searchHelp, type HelpEntry } from './help-guide';
import { parseLookup, type Lookup } from './assistant-lookup';

export type Route =
  | { kind: 'help'; entry: HelpEntry; others: HelpEntry[] }
  | { kind: 'help-choices'; options: HelpEntry[] }
  | { kind: 'lookup'; lookup: Lookup }
  | { kind: 'ai'; hint: HelpEntry[] };

const HOW_TO =
  /\b(lam sao|lam the nao|the nao|cach|o dau|huong dan|lam gi|nhu the nao|bam gi|nut nao|dung nhu the nao|co the .* khong|duoc khong)\b/;

/**
 * Decide who answers: the guide (no key needed), a read-only lookup of the teacher's own data (no key needed),
 * or the AI, which gets the nearest guide entries as the only source for how the site works.
 */
export function routeQuestion(question: string): Route {
  const folded = foldText(question);
  const help = searchHelp(question);
  const howTo = HOW_TO.test(folded);
  if (howTo && help.best) {
    if (help.confident) return { kind: 'help', entry: help.best, others: help.others.slice(0, 2) };
    return { kind: 'help-choices', options: [help.best, ...help.others].slice(0, 3) };
  }
  const lookup = parseLookup(question);
  if (lookup) return { kind: 'lookup', lookup };
  if (help.best && help.confident && folded.split(' ').length <= 8)
    return { kind: 'help', entry: help.best, others: help.others.slice(0, 2) };
  return { kind: 'ai', hint: help.best ? [help.best, ...help.others].slice(0, 3) : [] };
}
