/** Request bookkeeping for the personal-template panel: one operation at a time, nothing from a dead context lands, account loss locks. */
export interface RequestToken {
  signal: AbortSignal;
  /** False once the panel was closed/switched, the account was lost, or another operation took over. */
  isLive(): boolean;
  release(): void;
}

export class RequestGate {
  private holder: { token: RequestToken; controller: AbortController } | null = null;
  private closed = false;
  private accountLost = false;

  get disposed() { return this.closed; }
  get locked() { return this.accountLost; }
  get busy() { return this.holder !== null; }

  /** The only way to start a request; returns null while another one runs or the panel can no longer write. */
  begin(): RequestToken | null {
    if (this.closed || this.accountLost || this.holder) return null;
    const controller = new AbortController();
    const token: RequestToken = {
      signal: controller.signal,
      isLive: () => !this.closed && !this.accountLost && this.holder?.token === token,
      release: () => { if (this.holder?.token === token) this.holder = null; },
    };
    this.holder = { token, controller };
    return token;
  }
  private stop() { this.holder?.controller.abort(); this.holder = null; }
  /** Cancel the active operation while leaving this panel available for another attempt. */
  cancel() { this.stop(); }
  /** Panel unmounted or switched to another exam/account. */
  dispose() { this.closed = true; this.stop(); }
  /** The server said the account or session changed; nothing more is sent from this page. */
  lock() { this.accountLost = true; this.stop(); }
}

/** The pinned-account contract: 401, or 409 with code ACCOUNT_CHANGED. Never retry these under another user. */
export function isAccountFailure(status: number, body: unknown) {
  return status === 401 || status === 409 && typeof body === 'object' && body !== null && (body as { code?: unknown }).code === 'ACCOUNT_CHANGED';
}

/** Keep one idempotency ID while the request body is unchanged (retry), and a new one as soon as the body changes. */
export function createRequestIdentity(makeId: () => string) {
  let current: { fingerprint: string; id: string } | null = null;
  return (fingerprint: string) => {
    if (!current || current.fingerprint !== fingerprint) current = { fingerprint, id: makeId() };
    return current.id;
  };
}
