/** The PIN list for printing. Opens in Excel with Vietnamese names, and a leading zero in a PIN is kept. */
export const pinsToCsv = (rows: { displayName: string; pin: string }[]) =>
  '\uFEFFHọ và tên,PIN\r\n' + rows.map(row => `"${row.displayName.replace(/"/g, '""')}",="${row.pin}"`).join('\r\n') + '\r\n';
