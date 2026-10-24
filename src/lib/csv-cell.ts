/** Quote CSV fields and prevent teacher/student text from becoming spreadsheet formulas. */
export function csvCell(value: unknown): string {
  if (value == null) return '';
  let text = String(value).trim();
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return /[,"\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}
