#!/usr/bin/env bash
# Local full package; requires Node, Docker and PowerShell7 CurrentUser DPAPI.
# Default dry-run. No retention deletion. Old container/user/db positional arguments are rejected.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "$0")/.." && pwd)"
cd -- "$ROOT_DIR"
exec node scripts/backup-package.cjs "$@"