// Review only. No file or DB deletion, including --execute. Keep data until an owner approves exact removals.
const { fs, path, workspace, argumentsFor } = require('./database-tools.cjs');
const { loadPackage, safeWorkspacePath } = require('./backup-package-tools.cjs');
try {
  const args = argumentsFor(process.argv.slice(2));
  if (args.execute) throw Error('Retention is review-only; no automatic deletion is enabled');
  const days = Number(args.days ?? 30), keep = Number(args.keep ?? 2);
  if (!Number.isSafeInteger(days) || days < 1 || !Number.isSafeInteger(keep) || keep < 2) throw Error('Retention review requires days >= 1 and keep >= 2');
  const root = safeWorkspacePath(path.join(workspace, 'backups'));
  const valid = [], retainedUnknown = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) { retainedUnknown.push(entry.name); continue; }
    try {
      const bundle = loadPackage(path.join(root, entry.name));
      const time = Date.parse(bundle.manifest.createdAt ?? bundle.manifest.checkedAt);
      if (!Number.isFinite(time)) throw Error('Unknown date');
      const proofDirectory = path.join(bundle.root, 'restore-verifications');
      let verified = bundle.manifest.status === 'PASS_FOR_LOCAL_DB_FILES_CONFIG_RESTORE';
      if (fs.existsSync(proofDirectory) && !fs.lstatSync(proofDirectory).isSymbolicLink()) {
        for (const proof of fs.readdirSync(proofDirectory)) {
          if (!/^[a-z0-9_]+\.json$/.test(proof)) continue;
          try {
            const record = JSON.parse(fs.readFileSync(path.join(proofDirectory, proof), 'utf8'));
            if (record.status === 'RESTORED_VERIFIED' && record.packageDigest === bundle.manifest.backup.dumpSha256 && record.sourceUnchanged && record.tablesMatch && record.publicFilesMatch) verified = true;
          } catch { /* Unknown proof stays protected; never deletion. */ }
        }
      }
      valid.push({ name: entry.name, time, restoreVerified: verified });
    } catch { retainedUnknown.push(entry.name); }
  }
  valid.sort((a, b) => b.time - a.time);
  const protectedNames = new Set(valid.slice(0, keep).map(entry => entry.name));
  const reviewCandidates = valid.filter(entry => !protectedNames.has(entry.name) && Date.now() - entry.time > days * 86400000 && valid.filter(newer => newer.time > entry.time && newer.restoreVerified).length >= keep).map(entry => entry.name);
  console.log(JSON.stringify({ status: 'REVIEW_ONLY', days, keep, automaticDeletion: false, reviewCandidates, protectedNames: [...protectedNames], retainedUnknown, sourceModified: false }, null, 2));
} catch (error) { console.error(error instanceof Error ? error.message : 'Retention review failed'); process.exitCode = 1; }
