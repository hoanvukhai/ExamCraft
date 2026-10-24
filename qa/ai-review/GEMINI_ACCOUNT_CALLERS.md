# BÁO CÁO RÀ SOÁT TÀI KHOẢN GHIM (CALLER INVENTORY & ACCOUNT PINNING AUDIT)
*Phiên bản Đính chính Generation 5 (Mục G01 trong GEMINI-CONTINUOUS-BATCH) — Căn cứ đối chiếu thân hàm thực tế tại commit bb14bee và working tree*

- **Người thực hiện:** Gemini (QA Tài liệu / Phối hợp đa AI)
- **Nhiệm vụ:** `G01` thuộc `GEMINI-CONTINUOUS-BATCH` (Generation 5, `ASSIGNMENTS.json`)
- **Thời điểm rà soát (UTC):** 2026-10-24T13:18:00Z
- **Baseline đối chiếu:** `bb14bee` kèm các thay đổi đã tích hợp trong working tree của Codex (`rebuild/2026-10-local`)
- **Nguyên tắc kiểm toán:** Đọc thân handler đầy đủ; loại bỏ mọi nhận định chủ quan tuyệt đối; dùng link tương đối trong repo (không dùng `file:///`); đối chiếu báo cáo nhóm `qa/rebuild-2026-10-24/`.

---

## I. TỔNG QUAN KIẾN TRÚC GHIM TÀI KHOẢN (ACCOUNT PINNING)

Hệ thống bảo vệ phiên đa tab và chống CSRF bằng hai cách triển khai phía Server:
1. **Helper hợp nhất (`requireRequestAuth(req)` trong `src/lib/request-auth.ts`):**
   - Xác thực danh tính qua `requireAuth()`.
   - Kiểm tra `assertRequestAccount(req.headers, user.id)`: So khớp header `x-examcraft-user` từ client với `user.id`. Nếu lệch tài khoản do mở đa tab, trả về `409 ACCOUNT_CHANGED`.
   - Kiểm tra `isSameOriginMutation(req)` đối với các mutation (`POST`, `PUT`, `DELETE`, `PATCH`): Nếu sai Origin hoặc `sec-fetch-site: cross-site`, trả về `403`.
2. **Kiểm tra trực tiếp trong thân Handler:**
   - Handler import `requireAuth()`, sau đó gọi tường minh `assertRequestAccount(req.headers, user.id)` và `if (!isSameOriginMutation(req)) throw new ApiError(403, ...)`.
   - **Ghi nhận kỹ thuật:** Việc import `requireAuth` không đồng nghĩa với thiếu guard, miễn là thân handler có gọi trực tiếp các kiểm tra trên.

---

## II. BẢNG HIỆN TRẠNG ROUTE VÀ CALLER THEO PHÂN HỆ

| Phân hệ | Route API & Method | Lớp bảo vệ Server (Thân Handler) | Client Caller | Cơ chế Pin Client | Async Guard / Context Check | Trạng thái bảo vệ & Bằng chứng kiểm thử |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bản mẫu (Templates)** | `GET/POST /api/templates`<br>`GET/DELETE /api/templates/[id]` | `requireRequestAuth(req)` (`src/app/api/templates/route.ts:9, 15`) | `src/components/ExamTemplatePanel.tsx` | `accountFetch(ownerId, ...)` | Đã tích hợp `RequestGate`: abort/dispose khi unmount hoặc đổi key; khóa panel khi nhận 401/409. | Đã có guard backend và gate client. Phủ trong `tests/template_request_context.test.ts` (6 test) và HTTP suite (`qa/rebuild-2026-10-24/TEMPLATE_IMPORT_ACCOUNT.md`). UI runtime chưa kiểm do CUA. |
| **Kho & Soạn thảo đề thi** | `GET /api/exams`<br>`POST /api/exams`<br>`GET /api/exams/[id]`<br>`PATCH /api/exams/[id]`<br>`DELETE /api/exams/[id]` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` và `isSameOriginMutation(req)`:<br>- `src/app/api/exams/route.ts:15, 36, 38`<br>- `src/app/api/exams/[id]/route.ts:16, 25, 27, 37, 39` | `src/components/TeacherDashboard.tsx`<br>`src/components/ExamLibraryModal.tsx` | `accountFetch(currentUser.id, ...)`<br>`fetch` gắn `x-examcraft-user: ownerId` | Có CAS `If-Match: version` chống ghi đè phiên bản cũ; kiểm tra quyền tác giả/cộng tác viên. | Đã có guard ghim tài khoản và origin trực tiếp trong handler. Phủ trong `tests/http_workflows.test.ts`. UI runtime chưa kiểm do CUA. *(Đính chính: không có lỗ hổng CSRF/thiếu pin)*. |
| **Ngân hàng câu hỏi** | `GET/POST /api/questions`<br>`GET/PUT/DELETE /api/questions/[id]`<br>`POST /api/questions/[id]/fork`<br>`GET /api/questions/shared` | `requireRequestAuth(req)` (`src/app/api/questions/route.ts:36, 111`) | `src/lib/question-client.ts`<br>`src/components/QuestionBankModal.tsx` | `accountFetch(ownerId, ...)` | Quản lý state tập trung, báo lỗi modal. | Đã có guard qua `requireRequestAuth` và `accountFetch`. UI runtime chưa kiểm. |
| **Lớp học (Groups)** | `GET/POST /api/groups`<br>`GET/PUT/DELETE /api/groups/[id]` | `requireRequestAuth(req)` (`src/app/api/groups/route.ts:30, 64`) | `src/app/teacher/groups/page.tsx`<br>`src/components/ShareModal.tsx` | `accountFetch(expectedOwner, ...)`<br>`accountFetch(ownerId, ...)` | `ShareModal` dùng `AbortController`; `teacher/groups` đối chiếu `expectedOwner`. | Đã có guard. Phủ trong bộ kiểm thử `tests/http_auth.test.ts`. UI runtime chưa kiểm. |
| **BYOK & Usage** | `GET/POST/DELETE/PATCH /api/user/keys`<br>`POST /api/user/keys/test`<br>`GET /api/user/ai-usage` | `requireRequestAuth(req)` (`src/app/api/user/keys/route.ts:23, 41, 52, 61`) | `src/components/ApiKeyModal.tsx`<br>`src/components/TeacherDashboard.tsx`<br>`src/components/ExamWorkspace.tsx` | `accountFetch(ownerId, ...)`<br>`accountFetch(currentUser.id, ...)` | Modal hiển thị trạng thái và quản lý log riêng. | Đã có guard bảo vệ khóa API cá nhân. UI runtime chưa kiểm. |
| **Di chuyển dữ liệu cũ** | `POST /api/migration/import-legacy` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` (`src/app/api/migration/import-legacy/route.ts:14`) và `isSameOriginMutation(req)` (dòng 15) trước khi đọc dữ liệu import | `src/components/ExamLibraryModal.tsx:51, 73` | `fetch` thủ công gắn `x-examcraft-user: ownerId` | Có `dryRun` xác nhận trước khi lưu thực sự; schema giới hạn 100 đề / 1.000 câu. | Đã có guard ghim tài khoản và origin trực tiếp trong handler. Phủ trong HTTP test suite cũ. *(Đính chính: không thiếu pin)*. |
| **Bóc tách đề thi (Parse AI)** | `POST /api/parse-docx`<br>`POST /api/parse-exam-text`<br>`POST /api/ocr-exam-image` | Đã chuyển sang `requireRequestAuth(req)` (`src/app/api/parse-docx/route.ts:14`, `parse-exam-text:14`, `ocr-exam-image:13`) | `src/components/ImportModal.tsx` | `accountFetch(ownerId, ...)` | Wrapper có key theo `ownerId:documentId`, có abort signal khi unmount. | Đã có guard backend và client pin. Phủ trong `http-template-import.log`. UI runtime chưa kiểm do CUA. |
| **AI Memory giáo viên** | `GET/POST/DELETE /api/teacher/ai-memory`<br>`POST /api/teacher/ai-memory/archive`<br>`POST /api/teacher/ai-memory/analyze` | Đã chuyển sang `requireRequestAuth(req)` (`src/app/api/teacher/ai-memory/route.ts:18, 32, 65`) | `src/components/AiLearningModal.tsx` | `accountFetch` qua `AiMemoryContext` | `AiMemoryContext` có gắn gate, kiểm tra token live, khóa khi đổi tài khoản, giải phóng busy. | Đã có guard backend và gate client (tích hợp Claude Gen 6 + Codex). Phủ trong `qa/rebuild-2026-10-24/MEMORY_AND_SHARE_VERSION.md`. UI runtime chưa kiểm do CUA. |
| **Cộng tác đề thi** | `GET/POST/DELETE /api/exams/[id]/collaborators` | Server dùng `requireAuth()`, có kiểm tra `isSameOriginMutation` cho mutation, kiểm tra quyền `canManage` | `src/components/ExamCollaboratorsPanel.tsx` | `fetch` có gắn header `x-examcraft-user: expectedUserId` | Báo lỗi trực tiếp trên giao diện modal. | Đã có guard kiểm tra quyền sở hữu và CSRF. UI runtime chưa kiểm. |
| **Sao chép đề chia sẻ** | `POST /api/public/share/[id]/copy` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` (`src/app/api/public/share/[id]/copy/route.ts:14`) và `isSameOriginMutation(req)` (dòng 12) | `src/app/share/[id]/page.tsx:56` | `account.request(...)` (qua `usePinnedAccount`) | Khóa hàng `Exam` và `ShareLink` trong giao dịch; đối chiếu `sourceVersion` chống sao chép đề đã đổi. | Đã có guard backend và transaction lock. Phủ trong `qa/rebuild-2026-10-24/SHARE_TRANSACTION_REVALIDATION.md`. UI runtime chưa kiểm do CUA. |

---

## III. PHỤ LỤC ĐÍNH CHÍNH CÁC KẾT LUẬN CŨ (AUDIT ERRATA)

1. **Về `api/exams` và `api/exams/[id]`:**
   - *Kết luận cũ đợt 2:* Đánh giá thiếu ghim tài khoản và thiếu bảo vệ CSRF do chỉ nhìn thấy import `requireAuth`.
   - *Đính chính:* **Nhận định cũ là false-positive.** Thân handler của cả hai route đều gọi trực tiếp `assertRequestAccount(req.headers, user.id)` và `if (!isSameOriginMutation(req)) throw new ApiError(403)`. Đã được kiểm chứng trong bộ test `http_workflows.test.ts`.
2. **Về `api/migration/import-legacy`:**
   - *Kết luận cũ đợt 2:* Đánh giá có rủi ro rò rỉ chéo tài khoản.
   - *Đính chính:* **Nhận định cũ là false-positive.** Handler gọi trực tiếp `assertRequestAccount` (dòng 14) và `isSameOriginMutation` (dòng 15).
3. **Về các route bóc tách tài liệu AI (`parse-docx`, `parse-exam-text`, `ocr-exam-image`):**
   - *Hiện trạng:* Phát hiện về việc thiếu `x-examcraft-user` ở đợt 2 đã được Codex tiếp nhận và chuyển đổi sang `requireRequestAuth(req)` kèm cập nhật `ImportModal.tsx` dùng `accountFetch`.
4. **Về AI Memory giáo viên (`AiLearningModal.tsx`):**
   - *Hiện trạng:* Đã được tích hợp bàn giao Claude Gen 6 thành commit `804459e`, `8cec3d9`, `6eae5fd`, chuyển sang `requireRequestAuth(req)` và có context gate tại client.
5. **Về mức độ bằng chứng:**
   - Mọi kết luận trong báo cáo này căn cứ trên mã nguồn tĩnh và các log chạy HTTP test suite trên cơ sở dữ liệu thử nghiệm độc lập. Do công cụ CUA chưa khởi tạo được kernel assets trên Windows, giao diện người dùng thực tế (UI runtime) vẫn chưa được nghiệm thu và giữ trạng thái mở theo checklist sản phẩm.
