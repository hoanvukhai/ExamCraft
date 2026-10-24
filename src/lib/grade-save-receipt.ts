/** A successful POST alone does not prove the following GET still contains our grade.
 * Another teacher may have saved between the two. Keep the draft unless this receipt matches. */
export function gradeSaveReceiptMatches(questionId: string, comment: string, expectedScore: number | null, receipt: unknown): boolean {
  if (!receipt || typeof receipt !== 'object') return false;
  const saved = receipt as Record<string, unknown>;
  if (saved.questionId !== questionId || typeof saved.gradeRevision !== 'string' || !/^[a-f0-9]{64}$/.test(saved.gradeRevision)) return false;
  if (saved.teacherComment !== null && typeof saved.teacherComment !== 'string') return false;
  if ((saved.teacherComment ?? '') !== comment) return false;
  return expectedScore === null ? saved.manualScore === null || saved.manualScore === 0
    : typeof saved.manualScore === 'number' && Number.isFinite(saved.manualScore) && saved.manualScore === expectedScore;
}
