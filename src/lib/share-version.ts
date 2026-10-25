import { randomBytes } from 'node:crypto';

/**
 * A share link made now is pinned to the exam version it was created from. The version rides in the link token
 * (`<random>.v<version>`), so no schema change is needed: base64url never contains '.', and a token that does not
 * match a stored row exactly never resolves. Links made before pinning have no suffix and keep following the exam.
 */
export function newShareToken(version: number) {
  if (!Number.isInteger(version) || version < 1) throw new Error('Invalid exam version for a share link');
  return `${randomBytes(32).toString('base64url')}.v${version}`;
}

export function pinnedVersion(token: string): number | null {
  const match = /\.v(\d{1,9})$/.exec(token);
  const version = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(version) && version >= 1 ? version : null;
}
