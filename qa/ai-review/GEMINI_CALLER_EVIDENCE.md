# BẢNG CALLER VÀ BẰNG CHỨNG BẢO VỆ TÀI KHOẢN (CALLER EVIDENCE AUDIT)
*Phiên bản Generation 5 (Mục G04 trong GEMINI-CONTINUOUS-BATCH) — Căn cứ mã nguồn thực tế tại commit bb14bee và working tree*

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G04` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm rà soát (UTC):** 2026-10-24T13:35:00Z
- **Baseline đối chiếu:** `bb14bee` kèm working tree hiện tại (`rebuild/2026-10-local`)
- **Phạm vi tập trung:** 6 phân hệ cốt lõi: `key`, `memory`, `template`, `import`, `share`, `teacher grading`.
- **Nguyên tắc đối chiếu:** Lần theo helper 1 cấp để chứng minh; chụp lại hiện trạng thực tế nhìn thấy trong mã; tách bạch rõ giữa cơ chế bảo vệ mã nguồn tĩnh và các khía cạnh chưa được kiểm thử runtime trên trình duyệt.

---

## I. CĂN CỨ KỸ THUẬT VÀ LẦN THEO HELPER 1 CẤP

### 1. Phía Client (Browser)
- **`accountFetch(ownerId, input, init)` (`src/lib/account-fetch.ts`):**
  - Kiểm tra `ownerId?.trim()`; nếu rỗng ném ngoại lệ chặn request.
  - Khởi tạo `headers.set('x-examcraft-user', ownerId)`. Đảm bảo header nhận diện tài khoản luôn được ghim theo ngữ cảnh người dùng đang đăng nhập trên UI.
- **`usePinnedAccount()` (`src/hooks/usePinnedAccount.ts`):**
  - Trả về `{ ownerId, error, request }`.
  - Hàm `request(url, init)` tự động kiểm tra `ownerId` và gắn `headers.set('x-examcraft-user', ownerId)`.
- **`RequestGate` / `MemoryGate` / `KeyContext`:**
  - Quản lý vòng đời yêu cầu (token, abort signal). Khi component unmount, hoặc đổi tài khoản, hoặc đổi đề/mẫu, gate bị dispose/lock, tự động hủy tín hiệu mạng và vô hiệu hóa việc ghi đè state từ các phản hồi trễ.

### 2. Phía Server (API Handler)
- **`requireRequestAuth(req)` (`src/lib/request-auth.ts`):**
  - Cấp 1: Gọi `user = await requireAuth()` (kiểm tra session/cookie người dùng).
  - Cấp 2: Gọi `assertRequestAccount(req.headers, user.id)`. So khớp giá trị `x-examcraft-user` do client gửi lên với `user.id`. Nếu lệch do người dùng mở nhiều tab hoặc đổi tài khoản ở tab khác, ném `ApiError(409, 'Tài khoản đăng nhập đã thay đổi...', 'ACCOUNT_CHANGED')`.
  - Cấp 3: Với các phương thức thay đổi dữ liệu (`POST`, `PUT`, `DELETE`, `PATCH`), kiểm tra `isSameOriginMutation(req)`. Nếu sai Origin hoặc vi phạm CSRF, ném `ApiError(403, 'Yêu cầu không hợp lệ')`.
- **Kiểm tra trực tiếp trong Handler (Direct Guards):**
  - Một số route không bọc helper `requireRequestAuth` mà gọi trực tiếp `assertRequestAccount(req.headers, user.id)` và `isSameOriginMutation(req)`. Đây là kiểm soát tương đương, không phải lỗ hổng.

---

## II. BẢNG CHI TIẾT CALLER VÀ BẰNG CHỨNG THEO 6 PHÂN HỆ CỐT LÕI

| Phân hệ | File Component | Hàm gọi (Caller) | Method & Route API | Vị trí Header / Client Gate | Server Guard trong Handler | Phần chưa biết / Chưa kiểm |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Key** | `src/components/ApiKeyModal.tsx:60-120` | `loadKeys` | `GET /api/user/keys` | `accountFetch(ownerId, ...)` kèm `KeyContext` token | `requireRequestAuth(req)` (`src/app/api/user/keys/route.ts:26`); chỉ truy vấn `userId: user.id`. | Chưa kiểm thử UI thật trên trình duyệt (CUA Windows mở). |
| **Key** | `src/components/ApiKeyModal.tsx:125-160` | `addKey` | `POST /api/user/keys` | `accountFetch(ownerId, ...)` gửi kèm `clientRequestId` | `isSameOriginMutation(req)` (`route.ts:42`), `requireRequestAuth(req)` (`route.ts:44`), transaction mã hóa AES-GCM + so khớp chống trùng `timingSafeEqual`. | Chưa kết nối live Gemini provider thật với key thực tế có trả phí. |
| **Key** | `src/components/ApiKeyModal.tsx:170-190` | `deleteKey` | `DELETE /api/user/keys/[id]` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/user/keys/[id]/route.ts:16`), `deleteMany({ where: { id, userId: user.id } })`. | Chưa kiểm tra thao tác click nút xóa trên UI. |
| **Key** | `src/components/ApiKeyModal.tsx:195-215` | `testKey` | `POST /api/user/keys/[id]/test` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)`, giải mã AES-GCM trong bộ nhớ, gọi kiểm tra hạn mức Google GenAI. | Test mock kỹ thuật đã pass; chưa chạy key thật. |
| **Key** | `src/components/ApiKeyModal.tsx:218-226` | `loadUsage` | `GET /api/user/ai-usage` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/user/ai-usage/route.ts:15`), chỉ đọc log của `user.id`. | Chưa kiểm tra hiển thị đồ thị token trên UI. |
| **Memory** | `src/components/AiLearningModal.tsx:75-95` | `loadMemories` | `GET /api/teacher/ai-memory` | `accountFetch(ownerId, ...)` qua `MemoryGate` | `requireRequestAuth(req)` (`src/app/api/teacher/ai-memory/route.ts:18`), lọc theo `teacherId: user.id`. | Chưa kiểm thử UI runtime. |
| **Memory** | `src/components/AiLearningModal.tsx:105-140` | `handleSaveNew` | `POST /api/teacher/ai-memory` | `accountFetch(ownerId, ...)` kèm `MemoryGate.begin()` | `requireRequestAuth(req)` (`src/app/api/teacher/ai-memory/route.ts:32`), upsert CAS `clientRequestId`. | Chưa kiểm thử nhập liệu thực tế trên trình duyệt. |
| **Memory** | `src/components/AiLearningModal.tsx:150-170` | `handleDelete` | `DELETE /api/teacher/ai-memory` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/teacher/ai-memory/route.ts:65`), `deleteMany({ where: { id, teacherId: user.id } })`. | Chưa kiểm thử UI. |
| **Memory** | `src/components/AiLearningModal.tsx:175-200` | `handleArchive` | `POST /api/teacher/ai-memory/archive` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/teacher/ai-memory/archive/route.ts:15`), cập nhật `archivedAt`. | Chưa kiểm thử UI. |
| **Memory** | `src/components/AiLearningModal.tsx:205-230` | `handleAnalyze` | `POST /api/teacher/ai-memory/analyze` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/teacher/ai-memory/analyze/route.ts:16`), phân tích đề thi với AI key quay vòng. | Chưa kiểm thử live AI. |
| **Template** | `src/components/ExamTemplatePanel.tsx:54-70` | `loadList` | `GET /api/templates` | `accountFetch(ownerId, ...)` qua `RequestGate` | `requireRequestAuth(req)` (`src/app/api/templates/route.ts:9`), transaction `listPersonalTemplates(tx, user.id, ...)`. | Đã có unit/HTTP test; UI chưa kiểm. |
| **Template** | `src/components/ExamTemplatePanel.tsx:75-95` | `loadDetail` | `GET /api/templates/[id]` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/templates/[id]/route.ts:9`), kiểm tra `ownerId: user.id`. | UI chưa kiểm. |
| **Template** | `src/components/ExamTemplatePanel.tsx:100-125` | `saveTemplate` | `POST /api/templates` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/templates/route.ts:15`), transaction lưu snapshot và CAS. | UI chưa kiểm. |
| **Template** | `src/components/ExamTemplatePanel.tsx:130-145` | `deleteTemplate` | `DELETE /api/templates/[id]` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/templates/[id]/route.ts:15`), `deleteMany({ where: { id, ownerId: user.id } })`. | UI chưa kiểm. |
| **Import** | `src/components/ImportModal.tsx:150-165` | `send` (Word) | `POST /api/parse-docx` | `accountFetch(ownerId, ...)` qua `RequestGate` | `requireRequestAuth(req)` (`src/app/api/parse-docx/route.ts:14`), `isSameOriginMutation(req)` (dòng 15), giới hạn tệp 20MB. | UI kéo thả file thực tế chưa kiểm. |
| **Import** | `src/components/ImportModal.tsx:150-165` | `send` (Text) | `POST /api/parse-exam-text` | `accountFetch(ownerId, ...)` qua `RequestGate` | `isSameOriginMutation(req)` (`src/app/api/parse-exam-text/route.ts:13`), `requireRequestAuth(req)` (dòng 14), giới hạn 50.000 ký tự. | UI dán văn bản chưa kiểm. |
| **Import** | `src/components/ImportModal.tsx:150-165` | `send` (Ảnh) | `POST /api/ocr-exam-image` | `accountFetch(ownerId, ...)` qua `RequestGate` | `requireRequestAuth(req)` (`src/app/api/ocr-exam-image/route.ts:13`), `isSameOriginMutation(req)` (dòng 14), giới hạn ảnh 20MB. | Chưa chạy OCR thực tế với ảnh chụp thật. |
| **Share** | `src/components/ShareModal.tsx:100-115` | `loadGroups` | `GET /api/groups` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)` (`src/app/api/groups/route.ts:30`), chỉ đọc lớp của `ownerId: user.id`. | UI chọn lớp chưa kiểm. |
| **Share** | `src/components/ShareModal.tsx:135-160` | `handleCreateAssignment` | `POST /api/assignments` | `accountFetch(ownerId, ...)` | `requireRequestAuth(req)`, bóc tách snapshot bất biến của đề thi. | UI giao bài chưa kiểm. |
| **Share** | `src/components/ShareModal.tsx:190-195` | `createShareLink` | `POST /api/exams/[id]/share` | `accountFetch(ownerId, ...)` | Gọi `assertRequestAccount` và `isSameOriginMutation`, kiểm tra quyền sở hữu đề trước khi mở link. | UI mở chia sẻ chưa kiểm. |
| **Share** | `src/app/share/[id]/page.tsx:44-63` | `loadSharedExam` | `GET /api/public/share/[id]` | `fetch(..., { cache: 'no-store' })` (Public visitor) | Route công khai: kiểm tra link tồn tại, chưa hết hạn, làm sạch đáp án qua `sanitizeSnapshotForStudent`. | Không có dữ liệu bí mật; UI chưa kiểm. |
| **Share** | `src/app/share/[id]/page.tsx:73-90` | `handleCloneToLocal` | `POST /api/public/share/[id]/copy` | `account.request(...)` qua `usePinnedAccount` và `copyGate` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` (`route.ts:14`), `isSameOriginMutation` (dòng 12), transaction khóa hàng và đối chiếu `sourceVersion`. | Đã kiểm thử backend (`SHARE_TRANSACTION_REVALIDATION.md`). UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:155-183` | `fetchAssignmentData` | `GET /api/teacher/assignments/[id]` | `accountRequest(...)` qua `usePinnedAccount` | `requireRequestAuth(req)` (`route.ts:18`), đối chiếu `ownerId: user.id`. | Polling 4s tự động; UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:200-215` | `handleToggleStatus` | `PATCH /api/teacher/assignments/[id]` | `accountRequest(...)` | `requireRequestAuth(req)`, `isSameOriginMutation`, cập nhật trạng thái `OPEN` / `CLOSED`. | UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:219-240` | `handleOpenAttemptDetail` | `GET /api/teacher/attempts/[id]` | `accountRequest(...)` | `requireRequestAuth(req)` (`src/app/api/teacher/attempts/[id]/route.ts:23`), kiểm tra `attempt.assignment.ownerId === user.id`. | Đã kiểm tra phân trang cursor; UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:283-311` | `handleSaveGrade` | `POST /api/teacher/attempts/[id]` | `accountRequest(...)` kèm `baseGradeRevision` | `requireRequestAuth(req)` (`route.ts:50`), `isSameOriginMutation`, kiểm tra CAS `baseGradeRevision`, ghi AuditLog. | Đã kiểm tra logic CAS trong test suite; UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:314-340` | `handleConfirmRestore` | `POST /api/teacher/attempts/[id]` | `accountRequest(...)` (body: `{ action: 'restore', ... }`) | `requireRequestAuth(req)`, đọc lại trạng thái lịch sử trong giao dịch, đối chiếu `baseGradeRevision`, tạo bản ghi audit mới. | Đã kiểm tra logic restore trong `tests/grade_history_restore.test.ts`. UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:352-369` | `handleDeleteAttempt` | `DELETE /api/teacher/attempts/[id]` | `accountRequest(...)` | `requireRequestAuth(req)`, kiểm tra quyền chủ sở hữu đề thi trước khi xóa lượt thi. | Thao tác xóa lượt làm bài; UI chưa kiểm. |
| **Grading** | `src/app/teacher/assignments/[id]/page.tsx:380-386` | `downloadCsv` | `GET /api/teacher/assignments/[id]/export-csv` | `accountRequest(...)` | `requireRequestAuth(req)` (`export-csv/route.ts:29`), kiểm tra `ownerId`, làm sạch chống CSV Formula Injection (`sanitizeCsvCell`). | Đã kiểm tra định dạng CSV cho bài không số; UI tải file chưa kiểm. |

---

## III. TỔNG KẾT VÀ GHI NHẬN RÀ SOÁT

1. **Sự đồng bộ giữa Client và Server:**
   - 100% các API thay đổi dữ liệu (mutation) trong 6 phân hệ cốt lõi đều được bảo vệ kép: Client ghim tài khoản qua `x-examcraft-user` (`accountFetch` / `usePinnedAccount`), Server kiểm tra `assertRequestAccount` (hoặc bọc trong `requireRequestAuth`) và chặn `isSameOriginMutation`.
   - Các thao tác bất đồng bộ có nguy cơ xung đột phiên bản cao (Lưu mẫu, Sao chép đề chia sẻ, Chấm bài thủ công, Khôi phục lịch sử chấm) đều được kiểm soát bởi các token CAS (`baseGradeRevision`, `sourceVersion`, `clientRequestId`).
2. **Khía cạnh chưa được kiểm chứng (Giới hạn đánh giá):**
   - **UI Runtime:** Toàn bộ các tương tác nút bấm, mở modal, chuyển tab và hiển thị lỗi trên trình duyệt chưa thể nghiệm thu tự động do công cụ CUA trên Windows gặp lỗi tài nguyên kernel. Cần thực hiện kiểm thử thủ công theo bộ thẻ `GEMINI_MANUAL_TEST_CARDS.md`.
   - **Tích hợp bên thứ ba:** Quản lý khóa API (`BYOK`) và OCR/bóc tách tài liệu AI chỉ mới được xác minh qua các kịch bản kiểm thử giả lập (mocking); chưa chạy trên các khóa API Google GenAI thật có phát sinh chi phí.
