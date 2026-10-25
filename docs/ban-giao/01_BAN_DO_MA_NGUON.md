# Bản đồ mã nguồn — tra theo công việc

Đợt25/10: [lưu câu đổi, offline/CSV và kiểm cuối](../../qa/rebuild-2026-10-25/BATCH_SUMMARY.md). Mã liên quan: `question-row-change.ts`, `exam-persistence.ts`, `csv-cell.ts`, route teacher export-csv và `tests_pilot/pilot.test.ts`.

Đọc hàng cần làm; không cần đọc hết các tệp bên dưới. Đường dẫn tương đối dùng được khi chuyển checkout. Đây là bản đồ vị trí, không chứng nhận chức năng hoàn tất.

Đợt tiếp25/10: [rà soát, trình chiếu, ngân hàng và Word Song song](../../qa/rebuild-2026-10-25/EXAM_REVIEW_AND_PRESENTATION.md); `exam-review.ts`, `ExamReviewPanel.tsx`, `ExamPresentation.tsx`, `QuestionCard.tsx`, `docx-export.ts`.

## Tìm đúng phần

| Nhóm / CV | Điểm vào và hợp đồng | Kiểm tra / bằng chứng |
|---|---|---|
| Kho, điều hướng, mẫu dễ hiểu;004,015,027–029 | [TeacherDashboard](../../src/components/TeacherDashboard.tsx), [ExamLibraryModal](../../src/components/ExamLibraryModal.tsx), [HeaderSettingsModal](../../src/components/HeaderSettingsModal.tsx), `src/app/page.tsx` | WORKSPACE; HTTP kho/quyền; UI riêng |
| Lưu, nháp, chuyển dữ liệu;006–010,014–015 | [useExamPersistence](../../src/components/useExamPersistence.ts), `exam-client.ts`, `exam-document.ts`, [exam-persistence](../../src/lib/exam-persistence.ts), `exam-draft.ts`, `legacy-import.ts`; `src/app/api/exams/`, `src/app/api/migration/import-legacy/` | `persistence_permissions.test.ts`, `integration_s1.test.ts`, `http_workflows.test.ts`; TESTING |
| Câu/đề, phần/ngữ liệu;007–008,023–026 | [types/exam](../../src/types/exam.ts), [ExamWorkspace](../../src/components/ExamWorkspace.tsx), `QuestionCard.tsx`, `QuestionEditor.tsx`, `ExamStructureEditor.tsx`, `FigureEditor.tsx` | `portable_and_exports.test.ts`, `import_document.test.ts`; WORKSPACE |
| Môn/lớp, nguồn, scope, mẫu;016–022,066,070–071 | [education-catalog](../../src/lib/education-catalog.ts), `src/config/education/`, `subject-config.ts`, [knowledge-package](../../src/lib/knowledge-package.ts), `question-knowledge.ts`, `KnowledgeScopeEditor.tsx`, `matrix-spec-generator.ts` | `education.test.ts`, `knowledge_package.test.ts`; EDUCATION, KNOWLEDGE_SCOPE; sổ nghiên cứu |
| AI sinh/sửa/kiểm;031–038,053 | [generation-plan](../../src/lib/generation-plan.ts), `GenerateModal.tsx`, `ExamCopilotBar.tsx`, `AiProposalPreview.tsx`, `copilot-result.ts`, `answer-review.ts`; `src/app/api/generate-exam/`, `exam-copilot/`, `tweak-question/`, `verify-question/` | `generation_and_drafts.test.ts`, `answer_review_and_shuffle.test.ts`; GENERATION, WORKSPACE |
| Key/usage;013,031–033 | [ai-policy](../../src/lib/ai-policy.ts), `gemini-keys.ts`, `crypto.ts`, `ApiKeyModal.tsx`; `src/app/api/user/keys/`, `user/ai-usage/` | `ai_policy.test.ts`; BYOK |
| Auth/quyền;011–013,047–053 | [auth](../../src/lib/auth.ts), `auth-security.ts`, `request-account.ts`, [exam-collaboration](../../src/lib/exam-collaboration.ts); `src/app/api/auth/`, `exams/[id]/collaborators/`, `comments/`, `history/`, `share/` | `auth_security.test.ts`, `http_auth.test.ts`, `persistence_permissions.test.ts`; ACCESS, COLLABORATION |
| Ngân hàng/fork/lịch sử câu;015,025,052 | [question-client](../../src/lib/question-client.ts), `question-history.ts`, `QuestionBankModal.tsx`; `src/app/api/questions/`. [db.ts](../../src/lib/db.ts) còn vai trò local/adapter cũ, không tự coi là nguồn server | `question_history.test.ts`, HTTP bank; WORKSPACE |
| Nhập/trộn/xuất/trình chiếu;039–046 | [import-document](../../src/lib/import-document.ts), `ImportModal.tsx`; API `parse-docx/`, `parse-exam-text/`, `ocr-exam-image/`; `shuffler.ts`, [docx-export](../../src/lib/docx-export.ts), `export-figures.ts`, `A4Preview.tsx`, `ExamPresentation.tsx` | `import_document.test.ts`, `portable_and_exports.test.ts`, `answer_review_and_shuffle.test.ts`; WORKSPACE, ảnh và `browser_export.json` |
| Public/giao bài/chấm;012,030,048,054–062 | [public-exam](../../src/lib/public-exam.ts), `attempt-access.ts`, `attempt-layout.ts`, `snapshot-scoring.ts`, `structured-question.ts`, `auto-grader.ts`, `manual-grading.ts`; `src/app/api/public/`, `assignments/`, `teacher/attempts/`; trang `a/`, `test/`, `share/`, `teacher/` | `public_access.test.ts`, `structured_grading.test.ts`, `manual_grading.test.ts`, HTTP workflow; ACCESS |
| Ghi chú, truy xuất, trợ lý;063–069 | [memory-document](../../src/lib/memory-document.ts), `AiLearningModal.tsx`, `TeacherAiSecretaryDrawer.tsx`; `src/app/api/teacher/ai-memory/`, `teacher/assistant/` | `portable_and_exports.test.ts`, HTTP memory; WORKSPACE, BYOK. Chưa có nghĩa đã xong kho chung hoặc đánh giá AI |
| Schema/bảo toàn/vận hành;001–003,014,072–078 | [schema](../../prisma/schema.prisma), `prisma/migrations/`, [scripts](../../scripts), [package.json](../../package.json) | `migration-verification.json`, `main-migration.json`, TESTING; checklist cho các cổng còn lại |

Các nhóm mới23/10 (chỉ đọc nhóm liên quan):

| Nhóm | Mã / bằng chứng |
|---|---|
| Backup/restore local | `scripts/backup-package-tools.cjs`, `backup-package.cjs`, `restore-package.cjs`, `backup-retention.cjs`, `rehearse-restored-app.cjs`; [runbook](../van-hanh/SAO_LUU_KHOI_PHUC_LOCAL.md), [OPERATIONS_REHEARSAL](../../qa/rebuild-2026-10-23/OPERATIONS_REHEARSAL.md), `tests/backup_package.test.ts` |
| Nháp writer/quyền đối tượng | `exam-draft.ts`, `useExamPersistence.ts`, `account-fetch.ts`, `request-auth.ts`; [WRITER_SLOTS](../../qa/rebuild-2026-10-23/WRITER_SLOTS.md), [OBJECT_ACCESS](../../qa/rebuild-2026-10-23/OBJECT_ACCESS.md) |
| Chat phạm vi | `scope-chat.ts`, `KnowledgeScopeEditor.tsx`, API `knowledge-scope/propose/`, `tests/scope_chat.test.ts`; [SCOPE_CHAT](../../qa/rebuild-2026-10-23/SCOPE_CHAT.md) |
| Kế hoạch mục tiêu | `exam-plan.ts`, `ExamPlanEditor.tsx`, `types/exam.ts`, `exam-document.ts`, `tests/exam_plan.test.ts`; [EXAM_PLAN](../../qa/rebuild-2026-10-23/EXAM_PLAN.md), trạng thái kiểm mới xem02 |
| Tiêu đề và dòng in | `header-layout.ts`, `HeaderSettingsModal.tsx`, `A4Preview.tsx`, `docx-export.ts`, `tests/header_layout.test.ts`; [HEADER_LAYOUT](../../qa/rebuild-2026-10-23/HEADER_LAYOUT.md) |
| Mẫu cá nhân | `exam-template.ts`, `exam-template-service.ts`, `ExamTemplatePanel.tsx`, API `templates/`, `tests/exam_template.test.ts`; [PERSONAL_TEMPLATES](../../qa/rebuild-2026-10-23/PERSONAL_TEMPLATES.md). Trạng thái tích hợp mới xem02; nguồn tự khai không phải nguồn đã duyệt |
| Mất kết nối và phản hồi lưu đến muộn | `useExamPersistence.ts`, `scripts/qa-scope-server.cjs`, `qa/rebuild-2026-10-23/persistence-browser-entry.tsx`; [NETWORK_OUTAGE](../../qa/rebuild-2026-10-23/NETWORK_OUTAGE.md), [DELAYED_SAVE](../../qa/rebuild-2026-10-23/DELAYED_SAVE.md) |
| Nháp sửa từng câu và màn hình nhỏ | `question-draft.ts`, `QuestionDraftPanel.tsx`, `QuestionEditor.tsx`, `QuestionCard.tsx`, `ExamWorkspace.tsx`, hai Navigation/CompanionRail; `tests/question_draft.test.ts`; [QUESTION_DRAFTS_AND_MOBILE](../../qa/rebuild-2026-10-23/QUESTION_DRAFTS_AND_MOBILE.md), trạng thái kiểm mới xem02 |
| Undo và thứ tự/nhân bản câu | `question-commands.ts`, `QuestionCard.tsx`, `ExamWorkspace.tsx`, `tests/question_commands.test.ts`; [QUESTION_COMMANDS](../../qa/rebuild-2026-10-23/QUESTION_COMMANDS.md). Fixture tạo có guard tại `scripts/qa-question-command-fixture.cjs`, chỉ DB thử và chỉ khi có cờ rõ |
| Xóa dữ liệu câu legacy qua canonical boundary | `exam-document.ts`, `tests/question_canonical_clear.test.ts`, regression trong `http_workflows.test.ts`; [QUESTION_CANONICAL_CLEAR](../../qa/rebuild-2026-10-23/QUESTION_CANONICAL_CLEAR.md), giữ opaque source và không hồi đáp án đã xóa |
| Duyệt đề xuất sửa câu AI theo bản nền | `question-ai-review.ts`, `QuestionCard.tsx`, `QuestionAiReview.tsx`, `tests/question_ai_review.test.ts`; [QUESTION_AI_REVIEW](../../qa/rebuild-2026-10-23/QUESTION_AI_REVIEW.md), preview/ack/guard và browser phản hồi giả; chưa kiểm provider thật |
| Copilot thanh bên: quyền, đề xuất và race | `copilot-submission.ts`, `CopilotProposalReview.tsx`, `RightCompanionRail.tsx`, `ExamWorkspace.tsx`, API `exam-copilot/`, `tests/copilot_submission.test.ts`; [COPILOT_GUARDS](../../qa/rebuild-2026-10-23/COPILOT_GUARDS.md). ExamCopilotBar cũ không được import; chưa coi đã chuyển luồng đó |
| Đề xuất bền và Undo/Redo Copilot | `ai-proposal-journal.ts`, `useAiProposal.ts`, `AiProposalJournalPanel.tsx`, `copilot-history.ts`, `CopilotHistoryControls.tsx`; [AI_JOURNAL_AND_HISTORY](../../qa/rebuild-2026-10-23/AI_JOURNAL_AND_HISTORY.md), journal5/history4test mới; archive còn xem lại, stack travel chưa bền qua reload |

Tên tệp không có tiền tố: helper ở `src/lib/`, thành phần `.tsx` ở `src/components/`, test ở `tests/`. Các báo cáo/JSON/ảnh không có tiền tố nằm trong [qa/rebuild-2026-10-22](../../qa/rebuild-2026-10-22). Dùng `rg --files` nếu đổi tên (log/DOM dump và tài liệu lịch sử bị `.rgignore` ẩn; thêm `--no-ignore` khi cần thấy chúng); không suy chức năng đã xong từ tên file.

## Luồng cần hiểu khi sửa lưu

`ExamWorkspace → useExamPersistence → exam-client → API exams → exam-persistence → Prisma`.

`exam-document` chuẩn hóa tài liệu; `types/exam` là kiểu chung. Metadata có snapshot `workspaceDocument`; không bỏ ngữ liệu/đáp án/hình khi sửa đường DB cũ. `serverId`/version từ xác nhận server khác version nháp. Header tài khoản kỳ vọng không thay quyền từ session. Public dùng DTO cho phép rõ trường, không phát nguyên tài liệu giáo viên. Bài đã giao dùng snapshot riêng.

## Chạy kiểm đúng mục đích

Nhóm giao/chấm mới24/10: [ASSIGNMENT_ACCESS_AND_STUDENT_FLOW](../../qa/rebuild-2026-10-23/ASSIGNMENT_ACCESS_AND_STUDENT_FLOW.md), `usePinnedAccount.ts`, ShareModal/StudentResultsModal, API assignments/share/teacher. Nhóm key retry/C01 và quyền nguồn share hiện hành: [KEY_CREATE_RETRY_AND_BATCH_REVIEW](../../qa/rebuild-2026-10-24/KEY_CREATE_RETRY_AND_BATCH_REVIEW.md), `ApiKeyModal.tsx`, `key-modal-request-context.ts`, API user/keys và share(create/public/copy). C02/C03 đã tích hợp/mount: [DRAFT_RECOVERY_INTEGRATION](../../qa/rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md), `teacher-grade-draft.ts`, `memory-note-draft.ts`, `grade-save-receipt.ts`, hai recovery panel, parent teacher assignment/AiLearningModal; chưa kiểm UI thực. Nhóm khóa/kiểm lại share trước: [SHARE_TRANSACTION_REVALIDATION](../../qa/rebuild-2026-10-24/SHARE_TRANSACTION_REVALIDATION.md), API public/share/[id]/copy và HTTP workflows (pg_blocking_pids chứng minh cả hai thứ tự). Nhóm memory/share phiên bản trước: [MEMORY_AND_SHARE_VERSION](../../qa/rebuild-2026-10-24/MEMORY_AND_SHARE_VERSION.md), `AiLearningModal.tsx`, `ai-memory-request-context.ts`, API teacher/ai-memory và public/share/copy, `share-copy.ts`. Nhóm template/import/account trước: [TEMPLATE_IMPORT_ACCOUNT](../../qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md), `template-request-context.ts`, `ExamTemplatePanel.tsx`, `ImportModal.tsx`, ba parse AI routes. Nhóm public policy/bài không số trước đó: [PUBLIC_POLICIES_AND_NONNUMERIC](../../qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md), `attempt-access.ts`, public submit/draft/assignment, teacher monitor/detail/export-csv, `http_public_policies.test.ts`. Nhóm trước restore/nhận xét/nộp offline/share: [RESTORE_NETWORK_SHARE](../../qa/rebuild-2026-10-24/RESTORE_NETWORK_SHARE.md), `student-network.ts`, `grade-history-restore.ts`, `TeacherGradeEditor.tsx`. Nháp học sinh/phân trang trước đó: [STUDENT_WRITERS_IMPORT_AND_HISTORY](../../qa/rebuild-2026-10-24/STUDENT_WRITERS_IMPORT_AND_HISTORY.md), `student-draft-journal.ts`, `StudentDraftRecovery.tsx`, `grade-history-pagination.ts`, API public start/draft/submit và teacher attempts, trang `a/[publicId]`/teacher assignments. Nhiệm vụ Claude đợt2: [CLAUDE_TASK_02](../../qa/ai-review/coordination/CLAUDE_TASK_02.md). Đọc trạng thái02 trước tiếp build.

Tại gốc repo, đọc script trước khi chạy nếu cấu hình/đích đã đổi:

| Lệnh | Phạm vi |
|---|---|
| `npm test` | SAFE: không DB/AI; không chứng minh rollback PostgreSQL hay UI |
| `npm run test:integration` | Guard chọn DB thử; có ghi/cleanup fixture, không dùng DB chính |
| `npm run build` | Build/typecheck; dừng máy chủ đang dùng `.next` trước |
| `node --import tsx scripts/test-server.cjs --production` | Sau build, chạy DB thử ở `127.0.0.1:3117`; không đưa lên mạng ngoài |
| `npm run test:http` | Cần server thử ở trên và health xác nhận cô lập; không AI thật |
| `npm run lint` | Toàn repo; chưa có bằng chứng sạch toàn bộ. Lint theo file chỉ kết luận cho file đó |

Kiểm tài liệu chỉ cần đường dẫn/tính nhất quán, không khởi động DB/build/AI. `test:integration:legacy`, audit cũ và script probe model không thuộc SAFE; đọc tác dụng trước dùng. Không chạy seed, reset, `db push` hoặc migration trên DB chính để làm test pass. Các script backup/provision/apply có guard và thao tác riêng; không tự chạy vì thấy tên trong bản đồ.
