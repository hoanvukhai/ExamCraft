# BÁO CÁO RÀ SOÁT TÀI KHOẢN GHIM VÀ BẢN ĐỒ CALLER THEO HANDLER
*Phiên bản Đính chính Hoàn thiện (Mục GEM-P5 trong GEMINI-PILOT-PREP — Generation 6)*
*Căn cứ đối chiếu trực tiếp từng handler tại commit `rebuild/2026-10-local HEAD` và phản hồi thẩm định từ Codex/Claude*

- **Người thực hiện:** Gemini (QA / Tài liệu)
- **Nhiệm vụ:** `GEM-P5` thuộc `GEMINI-PILOT-PREP` (Generation 6, [ASSIGNMENTS.json](coordination/ASSIGNMENTS.json))
- **Mã CV đối chiếu:** `CV011` (Bảo vệ phiên, HttpOnly cookie & Account Pinning)
- **Thời điểm hoàn thiện (UTC):** 2026-10-24T15:00:00Z
- **Nguyên tắc:** Sửa gọn theo handler thực tế, không võ đoán, loại bỏ If-Match trong exam CAS (thay bằng `body.baseVersion`), sửa `PATCH` thay vì `PUT` cho câu hỏi, làm rõ điều kiện chặt chẽ của route bài giao/deadline, bỏ số đếm test khỏi bảng audit.

---

## I. TỔNG QUAN KIẾN TRÚC BẢO VỆ PHIÊN (ACCOUNT PINNING)

Hệ thống ExamCraft bảo vệ chống tấn công CSRF và chống thao tác nhầm tài khoản trên trình duyệt mở đa tab bằng hai cơ chế phía Server:
1. **Helper hợp nhất `requireRequestAuth(req)` (`src/lib/request-auth.ts`):**
   - Xác thực phiên đăng nhập qua `requireAuth()`.
   - Kiểm tra ghim tài khoản `assertRequestAccount(req.headers, user.id)`: So khớp header `x-examcraft-user` từ client với `user.id` trong phiên. Nếu phát hiện lệch tài khoản do mở đa tab, trả về `409 ACCOUNT_CHANGED`.
   - Kiểm tra `isSameOriginMutation(req)` đối với toàn bộ mutation (`POST`, `PUT`, `DELETE`, `PATCH`): Nếu sai Origin hoặc `sec-fetch-site: cross-site`, từ chối ngay với mã `403`.
2. **Kiểm tra trực tiếp trong thân Handler:**
   - Các route như `/api/exams` và `/api/exams/[id]` gọi trực tiếp `assertRequestAccount` và `if (!isSameOriginMutation(req)) throw new ApiError(403)` ngay đầu hàm.
   - Cơ chế này đảm bảo tính an toàn tương đương với việc bọc helper, loại bỏ hoàn toàn các nhận định false-positive trước đây.

---

## II. BẢNG HIỆN TRẠNG ROUTE VÀ CALLER THEO THỰC TẾ HANDLER

| Phân hệ / Nghiệp vụ | Route API & Method thực tế | Lớp bảo vệ Server (Thân Handler) | Cơ chế CAS / Ràng buộc dữ liệu | Client Caller & Cơ chế Pin | Bằng chứng & Tình trạng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kho & Soạn đề** | `GET /api/exams`<br>`POST /api/exams`<br>`GET /api/exams/[id]`<br>`PATCH /api/exams/[id]`<br>`DELETE /api/exams/[id]` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` và `isSameOriginMutation(req)`:<br>- `exams/route.ts:15, 36, 38`<br>- `exams/[id]/route.ts:16, 25, 27, 37, 39` | - **PATCH:** CAS kiểm tra phiên bản qua payload `body.baseVersion` trong `updateExamSchema` và giao dịch Prisma `updateExam` (trả về 409 nếu version không khớp).<br>- **DELETE:** Header `If-Match` hoặc query param `baseVersion` (trả về 428 nếu thiếu, 409 nếu xung đột). | `TeacherDashboard.tsx`<br>`ExamWorkspace.tsx`<br>`ExamLibraryModal.tsx`<br>*(Dùng `accountFetch(currentUser.id, ...)` gắn `x-examcraft-user`)* | Guard hoạt động trong handler. Phủ trong suite `tests/http_workflows.test.ts`. *(UI runtime: Chưa kiểm)*. |
| **Bản mẫu (Templates)** | `GET/POST /api/templates`<br>`GET/DELETE /api/templates/[id]` | Bọc `requireRequestAuth(req)` (`src/app/api/templates/route.ts:9, 15`) | CAS `version` kiểm tra khi sửa mẫu cá nhân. | `ExamTemplatePanel.tsx`<br>*(Dùng `accountFetch(ownerId, ...)` kèm `RequestGate` hủy request trễ)* | Đã có guard và gate client. Phủ trong `tests/template_request_context.test.ts` và báo cáo `TEMPLATE_IMPORT_ACCOUNT.md`. |
| **Ngân hàng câu hỏi** | `GET/POST /api/questions`<br>`GET/PATCH/DELETE /api/questions/[id]`<br>`POST /api/questions/[id]/fork`<br>`GET /api/questions/shared` | Bọc `requireRequestAuth(req)` (`src/app/api/questions/route.ts:36, 111`, `[id]/route.ts:18, 30, 48`) | - Phương thức cập nhật câu hỏi là **`PATCH`** (không dùng `PUT`).<br>- Kiểm tra quyền sở hữu `ownerId === user.id`. | `src/lib/question-client.ts`<br>`QuestionBankModal.tsx`<br>*(Dùng `accountFetch(ownerId, ...)`)* | Đã có guard ghim tài khoản và kiểm tra quyền tác giả. Phủ trong các bài test câu hỏi. |
| **Quản lý bài giao & Deadline** | `GET /api/teacher/assignments/[id]`<br>`PATCH /api/teacher/assignments/[id]` | Bọc `requireRequestAuth(req)` và `isSameOriginMutation(req)` (`assignments/[id]/route.ts:163, 165`) | - Body được xác thực qua `UpdateSchema.safeParse()` (trả về 400 nếu lỗi).<br>- Kiểm tra quyền sở hữu `assignment.ownerId === user.id` (trả về 404).<br>- Ràng buộc thời gian: `closesAt > opensAt` (trả về 400 nếu hạn đóng trước hoặc bằng giờ mở).<br>*(Kết luận 200 chỉ đạt khi thỏa mãn toàn bộ các điều kiện trên)*. | `src/app/teacher/assignments/[id]/page.tsx`<br>*(Gọi qua `accountRequest`)* | Đã có guard ghim tài khoản, CSRF và ràng buộc logic hạn nộp chặt chẽ trong handler. |
| **Lớp học (Groups)** | `GET/POST /api/groups`<br>`GET/PUT/DELETE /api/groups/[id]` | Bọc `requireRequestAuth(req)` (`src/app/api/groups/route.ts:30, 64`) | Kiểm tra quan hệ sở hữu lớp `group.ownerId === user.id`. | `teacher/groups/page.tsx`<br>`ShareModal.tsx`<br>*(Dùng `accountFetch(ownerId, ...)`)* | Đã có guard ghim tài khoản. Phủ trong suite `tests/http_auth.test.ts`. |
| **Khóa AI cá nhân (BYOK)** | `GET/POST/DELETE/PATCH /api/user/keys`<br>`POST /api/user/keys/test`<br>`GET /api/user/ai-usage` | Bọc `requireRequestAuth(req)` (`src/app/api/user/keys/route.ts:23, 41, 52, 61`) | Mã hóa khóa AES-256-GCM trong DB; client chỉ nhận `keyMasked`. | `ApiKeyModal.tsx`<br>`TeacherDashboard.tsx`<br>*(Dùng `accountFetch(ownerId, ...)`)* | Đã có guard bảo vệ khóa API. Live provider chưa chạy, chỉ kiểm thử mock. |
| **Di chuyển kho cũ (Migration)** | `POST /api/migration/import-legacy` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` (dòng 14) và `isSameOriginMutation(req)` (dòng 15) | Schema Zod giới hạn tối đa 100 đề / 1.000 câu; hỗ trợ cờ `dryRun` xác thực trước khi ghi. | `ExamLibraryModal.tsx:51, 73`<br>*(Gắn header `x-examcraft-user: ownerId`)* | Đã có guard trực tiếp trong handler. *(Đính chính: không thiếu pin)*. |
| **Bóc tách văn bản / OCR** | `POST /api/parse-docx`<br>`POST /api/parse-exam-text`<br>`POST /api/ocr-exam-image` | Bọc `requireRequestAuth(req)` (`parse-docx:14`, `parse-exam-text:14`, `ocr-exam-image:13`) | Giới hạn dung lượng: 20MB cho docx/ảnh, 50.000 ký tự cho văn bản thô. | `ImportModal.tsx`<br>*(Dùng `accountFetch(ownerId, ...)`)* | Đã có guard backend và client pin. Phủ trong log `http-template-import.log`. |
| **Sổ tay phong cách AI** | `GET/POST/DELETE /api/teacher/ai-memory`<br>`POST /api/teacher/ai-memory/archive`<br>`POST /api/teacher/ai-memory/analyze` | Bọc `requireRequestAuth(req)` (`ai-memory/route.ts:18, 32, 65`) | Ghim theo `userId`, lưu trữ ghi chú phong cách sư phạm; gắn `clientRequestId` chống gửi kép. | `AiLearningModal.tsx`<br>*(Dùng `AiMemoryContext` có gắn gate kiểm tra token live)* | Đã có guard backend và gate client. Phủ trong báo cáo `MEMORY_AND_SHARE_VERSION.md`. |
| **Cộng tác & Lịch sử đề** | `GET/POST/DELETE /api/exams/[id]/collaborators`<br>`GET/POST /api/exams/[id]/history` | Dùng `requireAuth()`, kiểm tra `isSameOriginMutation(req)`, kiểm tra quyền quản lý `canManage` | Khôi phục lịch sử đối chiếu `baseVersion` trong transaction, tạo bản ghi audit khôi phục. | `ExamCollaboratorsPanel.tsx`<br>*(Gắn header `x-examcraft-user: expectedUserId`)* | Đã có guard kiểm tra quyền và CSRF. |
| **Sao chép đề chia sẻ** | `POST /api/public/share/[id]/copy` | Gọi trực tiếp `assertRequestAccount(req.headers, user.id)` (dòng 14) và `isSameOriginMutation(req)` (dòng 12) | Khóa hàng `SELECT ... FOR UPDATE` trên cả `Exam` và `ShareLink`, đối chiếu `sourceVersion`. | `src/app/share/[id]/page.tsx:56`<br>*(Dùng `usePinnedAccount`)* | Đã có guard backend và transaction lock. Phủ trong báo cáo `SHARE_TRANSACTION_REVALIDATION.md`. |

---

## III. TỔNG KẾT ĐÍNH CHÍNH (KEY TAKEAWAYS)

1. **Về cơ chế CAS đề thi:** Mutation `PATCH /api/exams/[id]` sử dụng `body.baseVersion` trong payload JSON, không sử dụng header HTTP `If-Match` (header `If-Match` chỉ là tùy chọn phụ trong handler `DELETE`).
2. **Về thao tác sửa câu hỏi:** Handler câu hỏi sử dụng phương thức chuẩn **`PATCH`** (`/api/questions/[id]`), không sử dụng `PUT`.
3. **Về cập nhật bài giao và hạn nộp:** Tuyệt đối không suy diễn phản hồi `200` chung chung; handler `PATCH /api/teacher/assignments/[id]` kiểm soát tuần tự: ghim tài khoản -> kiểm tra CSRF cùng nguồn -> parse body qua Zod schema -> kiểm tra quyền sở hữu -> kiểm tra ràng buộc `closesAt > opensAt`.
4. **Về độ tin cậy tầng giao diện (UI Runtime):** Toàn bộ các cơ chế ghim tài khoản và guard backend đã được xác minh qua các bộ test HTTP và unit. Tầng giao diện người dùng thực tế trên trình duyệt vẫn cần thực hiện kiểm thử thủ công theo các thẻ kiểm tay đã ban hành tại `docs/huong-dan/THE_KIEM_TAY_PILOT.md` và `docs/huong-dan/THE_KIEM_TAY_GIAO_BAI_VA_WORD.md`.

---
*Tài liệu bàn giao mục `GEM-P5` — Hoàn thành nhiệm vụ `GEMINI-PILOT-PREP` (Generation 6).*
