import { spawnSync } from 'node:child_process';
import { requireTestDatabase } from './helpers/test-database';

// Legacy suites write fixtures. Never inherit the application database target.
const files = ['test_phase1_auth.ts', 'test_phase2_db_ai.ts', 'test_phase3_student_flow.ts', 'test_phase4_monitoring.ts', 'test_phase5_word_quality.ts'];
try {
  const database = requireTestDatabase();
  const childEnv = { ...process.env, DATABASE_URL: database };
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', `tests/${file}`], { stdio: 'inherit', env: childEnv });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Integration suite failed: ${file}`);
  }
  console.log(`${files.length} legacy integration suites completed. This does not certify HTTP permissions, backup restore, or all subjects.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Integration runner failed.');
  process.exitCode = 1;
}
