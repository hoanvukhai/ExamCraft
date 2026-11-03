import { routeQuestion } from './assistant-router';
import { formatHelp } from './help-guide';
/** Only explicit how-to questions use the local guide; generation intent remains with the model. */
export function localCopilotHelp(text: string): string | null {
  if (!/^(hướng dẫn|cách\b|làm sao|làm thế nào|ở đâu)/iu.test(text.trim())) return null;
  const route = routeQuestion(text);
  return route.kind === 'help' ? formatHelp(route.entry) : null;
}
