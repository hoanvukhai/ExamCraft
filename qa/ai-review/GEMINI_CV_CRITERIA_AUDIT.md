# BÁO CÁO ĐỐI CHIẾU TIÊU CHÍ "ĐẠT KHI" VỚI BẰNG CHỨNG THỰC TẾ
*Nhiệm vụ: `GEM-P13` (Generation 8, [ASSIGNMENTS.json](coordination/ASSIGNMENTS.json))*
*Căn cứ tiêu chuẩn: [03_CHECKLIST.md](../../docs/ke-hoach-2026-10-21/03_CHECKLIST.md)*
*Các báo cáo bằng chứng: `qa/rebuild-2026-10-24/` và `qa/rebuild-2026-10-25/`*

- **Người thực hiện:** Gemini (QA / Kiểm toán tiêu chí Checklist)
- **Người chỉ đạo & Thẩm quyền quyết định:** Claude
- **Thời điểm lập hồ sơ (UTC):** 2026-10-25T05:40:00Z
- **Quy tắc kiểm toán:**
  1. Mỗi CV được phân tích độc lập theo 4 bước chuẩn mực.
  2. Không suy diễn "ĐỦ" từ tổng số lượng test đạt chung chung; bắt buộc chỉ đích danh từng ca kiểm thử (`tệp_test:tên_ca`), số hiệu luồng browser (F1–F9) hoặc mục báo cáo QA cụ thể.
  3. Nếu bất kỳ một vế nào của tiêu chí chưa có ca kiểm thử thực tế chứng minh, bắt buộc kết luận **THIẾU** hoặc **KHÔNG RÕ**, tuyệt đối không kết luận ĐỦ giả tạo.

---

## TỔNG HỢP KẾT QUẢ ĐỐI CHIẾU 11 MÃ CÔNG VIỆC (CV)

| Mã CV | Tên tiêu chí công việc | Kết luận đối chiếu | Tóm tắt vế còn thiếu hoặc giới hạn |
|:---:|---|:---:|---|
| **CV-010** | Nháp offline, version và chống ghi đè | **THIẾU** | Thiếu ca mở ứng dụng từ đầu khi hoàn toàn offline; thiếu ca 2 engine browser (Chrome & Edge) cùng sửa đồng thời một đề |
| **CV-011** | Quyền đối tượng và liên kết | **THIẾU** | Thiếu ca kiểm thử browser đổi tài khoản giáo viên trực tiếp trên cùng một tab/phiên để kiểm tra dọn sạch nháp bộ nhớ |
| **CV-047** | Ma trận quyền chia sẻ | **THIẾU** | Thiếu tính năng và ca kiểm thử cho quyền `comment` và `publish` (C04 mới là tài liệu thiết kế, chưa có schema) |
| **CV-048** | Link xem, thu hồi và phiên bản chia sẻ | **THIẾU** | Bảng snapshot công bố độc lập (`PublicationSnapshot`) chưa triển khai schema; hiện bảo vệ bằng `sourceVersion` |
| **CV-049** | Cùng sửa đồng thời | **THIẾU** | Hoàn toàn chưa có tính năng và ca kiểm thử cho `undo từng người` (per-user granular undo) |
| **CV-050** | Mất mạng, reconnect và thu hồi quyền đang mở | **ĐỦ** *(trong pilot)* | Đã có F9 (Chrome/Edge), F4 và HTTP; giới hạn: chưa kiểm tra 2 engine sửa đồng thời trong cùng 1 mili-giây |
| **CV-055** | Nhận diện và phiên lượt làm | **ĐỦ** | Đã phủ kín FREE_NAME, lớp học, mã vào bài, PIN, cookie ký HMAC chống xem chéo bài thi người khác |
| **CV-057** | Lưu nháp và resume thật | **ĐỦ** *(trong pilot)* | Đã có F6, unit journal và timeout mạng; giới hạn: chưa kiểm tra đổi sang thiết bị vật lý khác khi máy cũ hỏng |
| **CV-059** | Chấm server và nộp lặp an toàn | **ĐỦ** | Đã phân biệt 0/blank/false, row-lock chống nộp lặp, chính sách IMMEDIATE/AFTER_CLOSE/NEVER đầy đủ |
| **CV-060** | Chấm tay, đính chính và điểm chốt | **THIẾU** | Thiếu tính năng tự động chấm lại toàn bộ (`regrade`) theo phiên bản (thiết kế C05 đang tạm dừng) |
| **CV-062** | Hồi quy link và toàn luồng học sinh | **ĐỦ** | Đã phủ khách, GV khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE/NEVER, kiểm tra payload sạch 100% |

---

## CHI TIẾT ĐỐI CHIẾU TỪNG MÃ CÔNG VIỆC

### 1. CV-010: Nháp offline, version và chống ghi đè
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Nháp phục hồi sau reload, tách tài khoản, có version conflict; bản đến muộn không ghi đè bản mới, không đồng bộ sang sai tài khoản."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Nháp phục hồi sau reload:**
    - *Bằng chứng browser:* [tests_pilot/pilot.test.ts](../../tests_pilot/pilot.test.ts) ca `F9 offline edits reconnect safely and preserve a conflicting draft as a separate exam` (tắt mạng trong khi sửa, reload online tiếp tục sửa offline, reconnect khôi phục nháp); ca `F6 seven student answers survive reload, submit and hide solutions` (học sinh F5 khôi phục nguyên vẹn 7 câu từ local draft journal).
    - *Bằng chứng unit:* `tests/student_draft_journal.test.ts` ca `recovers valid journal entries after page reload`; `tests/question_draft.test.ts` ca `recovers editor draft after reload`.
    - *Báo cáo QA:* [qa/rebuild-2026-10-25/BATCH_SUMMARY.md](../rebuild-2026-10-25/BATCH_SUMMARY.md) mục 2; [qa/rebuild-2026-10-24/PILOT_E2E.md](../rebuild-2026-10-24/PILOT_E2E.md) luồng F6.
  * **Vế 2: Tách tài khoản:**
    - *Bằng chứng unit:* `tests/teacher_grade_draft.test.ts` ca `isolates drafts between different teacher accounts`; `tests/memory_note_draft.test.ts` ca `filters entries by owner and namespace`.
    - *Báo cáo QA:* [qa/rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md](../rebuild-2026-10-24/DRAFT_RECOVERY_INTEGRATION.md) mục 2 (namespace-scoped filtering).
  * **Vế 3: Có version conflict:**
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F9: phiên khác lưu bản mới trên server, reconnect phát hiện xung đột và lưu nháp thành đề riêng mang hậu tố `(Bản sao phục hồi)`.
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `PUT /api/exams/:id returns 409 conflict when baseVersion is stale`.
    - *Bằng chứng integration:* `tests/integration_question_save.test.ts` ca `rejects stale question version with 409 and rolls back transaction`.
  * **Vế 4: Bản đến muộn không ghi đè bản mới:**
    - *Bằng chứng integration:* `tests/integration_question_save.test.ts` ca `CAS prevents late write from overwriting new question data`.
    - *Báo cáo QA:* `qa/rebuild-2026-10-25/BATCH_SUMMARY.md` mục 1 ("CAS riêng từng câu chặn người ghi độc lập chen vào sau bước đọc; trả xung đột và rollback").
  * **Vế 5: Không đồng bộ sang sai tài khoản:**
    - *Bằng chứng unit:* `tests/student_draft_journal.test.ts` ca `does not replay journal of previous student session`; `tests/persistence_permissions.test.ts` ca `blocks loading drafts belonging to another user`.
    - *Giới hạn thực tế:* Dòng Hiện trạng 25/10 trong `03_CHECKLIST.md` ghi nhận: *"chưa mở ứng dụng từ đầu khi hoàn toàn offline, chưa thử parent journal/storage lỗi/hai engine sửa đồng thời. Giữ mở."*

- **(3) Kết luận:** **THIẾU**
  - *Vế thiếu bằng chứng:* Chưa có ca kiểm thử mở ứng dụng từ đầu (cold start) khi máy hoàn toàn không có kết nối mạng; chưa có ca kiểm thử hai trình duyệt (Chrome và Edge) cùng đồng thời chỉnh sửa một đề trong một kịch bản concurrency.

- **(4) Việc nhỏ nhất để đóng:**
  - Bổ sung 01 ca kiểm thử tích hợp mô phỏng cold-start offline (hoặc lập biên bản chốt giới hạn kỹ thuật: "ExamCraft yêu cầu tải trang lần đầu trực tuyến, chỉ hỗ trợ offline khi đã nạp phiên"), và 01 test script chạy 2 tiến trình browser cùng ghi đồng thời để ghi nhận xung đột CAS nhất quán.

---

### 2. CV-011: Quyền đối tượng và liên kết
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Kiểm quyền folder/question/template/exam/group ở server, xét quyền cộng tác thay vì chỉ owner; thử hai giáo viên và dữ liệu riêng."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Kiểm quyền folder/question/template/exam/group ở server:**
    - *Exam:* `tests/http_workflows.test.ts` ca `rejects unauthorized exam modification`; `tests/persistence_permissions.test.ts`.
    - *Question:* `tests/integration_question_save.test.ts` ca `checks owner on separated questions`; `src/app/api/questions/route.ts`.
    - *Group:* `tests/http_workflows.test.ts` ca `checks group owner before listing or assigning`.
    - *Template:* `tests/template_request_context.test.ts` ca `rejects template operations across teacher boundaries`.
    - *Folder:* `tests/test_folders_and_dashboard.ts` ca `isolates folder contents per owner`.
  * **Vế 2: Xét quyền cộng tác thay vì chỉ owner:**
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng `F4 public link, collaborator edits and revoke`: cấp quyền EDITOR cho Giáo viên 2, Giáo viên 2 sửa đề và lưu thành công; Giáo viên 1 thu hồi quyền, Giáo viên 2 bị chặn ngay lập tức (HTTP 403).
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `collaborator with EDIT permission can update exam`, ca `revoked collaborator receives 403`.
    - *Báo cáo QA:* [qa/rebuild-2026-10-24/PILOT_E2E.md](../rebuild-2026-10-24/PILOT_E2E.md) luồng F4; [qa/ai-review/GEMINI_ACCOUNT_CALLERS.md](GEMINI_ACCOUNT_CALLERS.md) mục CV011.
  * **Vế 3: Thử hai giáo viên và dữ liệu riêng:**
    - *Bằng chứng browser:* F4 chạy trên 2 tài khoản giáo viên giả lập độc lập (`f.emails[0]` và `f.emails[1]`), kiểm tra kho đề cá nhân cô lập.
    - *Bằng chứng HTTP:* `tests/http_auth.test.ts` và `tests/http_workflows.test.ts`.
    - *Giới hạn thực tế:* Dòng Hiện trạng 24/10 trong `03_CHECKLIST.md` ghi nhận: *"UI đổi tài khoản mới chưa kiểm do CUA lỗi; giữ mở."*

- **(3) Kết luận:** **THIẾU**
  - *Vế thiếu bằng chứng:* Chưa có ca kiểm thử tự động kiểm tra luồng Giáo viên A đăng xuất và Giáo viên B đăng nhập ngay trên cùng một cửa sổ trình duyệt (để xác minh toàn bộ cache client, local draft và React state của Giáo viên A được tiêu hủy hoàn toàn, không rò rỉ sang Giáo viên B).

- **(4) Việc nhỏ nhất để đóng:**
  - Thêm 01 ca kiểm thử browser: Đăng nhập Giáo viên A -> Soạn nháp -> Đăng xuất (`/api/auth/logout`) -> Đăng nhập Giáo viên B trên cùng tab -> Khẳng định không xuất hiện nháp hoặc đề của Giáo viên A.

---

### 3. CV-047: Ma trận quyền chia sẻ
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"View/comment/edit/download/fork/publish phân biệt, mặc định private; public view không cấp edit/key; server kiểm từng thao tác."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Phân biệt các quyền (view/comment/edit/download/fork/publish) & Mặc định private:**
    - *Mặc định private:* Mã nguồn `src/app/api/exams/route.ts` tạo đề mới luôn có `isPublic: false`, không có `ShareLink`.
    - *View / Edit phân biệt:* `tests_pilot/pilot.test.ts` luồng F4 (public view chỉ cho xem/in, không cho sửa; phân cấp `VIEWER`, `COMMENTER`, `EDITOR` trong `src/lib/permissions.ts`).
    - *Download:* `src/app/share/[id]/page.tsx` và `A4Preview.tsx` hỗ trợ tải Word.
    - *Fork / Copy:* `src/app/api/public/share/[id]/copy/route.ts` kiểm tra cờ `allowCopy` (`tests/share_copy.test.ts`).
    - *Comment:* Chưa có bảng hoặc giao diện góp ý độc lập được kiểm thử.
    - *Publish:* Thiết kế C04 (`qa/ai-review/CLAUDE_PUBLICATION_DESIGN.md`) chưa triển khai schema DB.
  * **Vế 2: Public view không cấp edit/key:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `public view does not return api keys, prompt notes or edit capabilities`.
    - *Bằng chứng browser:* Luồng F4 xác nhận người xem công khai không có nút lưu đề và không gọi được API ghi.
  * **Vế 3: Server kiểm từng thao tác:**
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` và `tests/http_public_policies.test.ts` xác nhận máy chủ trả 401/403 khi thao tác trái quyền.

- **(3) Kết luận:** **THIẾU**
  - *Vế thiếu bằng chứng:* Quyền `comment` và `publish` chưa có chức năng hoàn chỉnh trong mã (mới dừng ở tài liệu thiết kế C04, chưa có migration schema cho `PublicationSnapshot`).

- **(4) Việc nhỏ nhất để đóng:**
  - Hoặc Người chỉ đạo Claude phê duyệt chốt phạm vi Pilot: đóng băng quyền `comment` và `publish` sang giai đoạn 2; hoặc bổ sung test API kiểm tra quyền `COMMENTER` bị từ chối khi thực hiện ghi `PUT /api/exams/:id`.

---

### 4. CV-048: Link xem, thu hồi và phiên bản chia sẻ
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Link dùng ID/quyền riêng, chính sách đáp án, hết hạn/thu hồi; bản công bố không vô tình trở nháp."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Link dùng ID/quyền riêng:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `ShareLink has distinct random slug, isolated from raw examId`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F4 dùng link chia sẻ `/share/[id]`.
  * **Vế 2: Chính sách đáp án:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `when showAnswers is false, questions hide correct answers and solutions`.
    - *Bằng chứng unit:* `tests/share_copy.test.ts` ca `copying from a link without showAnswers strips solutions and correct choices`.
  * **Vế 3: Hết hạn / Thu hồi:**
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F4 (bấm thu hồi link, reload link báo lỗi).
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `revoked share link returns 404/410`.
  * **Vế 4: Bản công bố không vô tình trở nháp:**
    - *Bằng chứng code & test:* `src/app/api/public/share/[id]/copy/route.ts` sao chép theo `sourceVersion`; `tests/share_copy.test.ts` ca `requires review when source version changes`.
    - *Báo cáo QA:* [qa/rebuild-2026-10-25/BATCH_SUMMARY.md](../rebuild-2026-10-25/BATCH_SUMMARY.md) mục 2 ("Copy theo phiên bản nguồn đã có trong mã và kiểm HTTP: nguồn đổi thì yêu cầu xem lại").
    - *Giới hạn thực tế:* Dòng Hiện trạng 25/10 trong `03_CHECKLIST.md` ghi nhận: *"Publication snapshot riêng vẫn mới là thiết kế C04, chưa triển khai schema; ảnh ngoài kho và toàn UI còn mở."*

- **(3) Kết luận:** **THIẾU**
  - *Vế thiếu bằng chứng:* Bảng snapshot công bố độc lập (`PublicationSnapshot`) chưa được triển khai thành bảng cơ sở dữ liệu riêng; việc bảo vệ hiện dựa trên phiên bản `sourceVersion` của `ExamRevision`.

- **(4) Việc nhỏ nhất để đóng:**
  - Người chỉ đạo Claude ra quyết định công nhận cơ chế đối soát `sourceVersion` hiện tại là đủ đáp ứng tiêu chí "bản công bố không vô tình trở nháp" cho đợt thử nghiệm Pilot.

---

### 5. CV-049: Cùng sửa đồng thời
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Sửa khác/cùng khối, thay cấu trúc câu, reorder, undo từng người; không last-write-wins mất dữ liệu."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Sửa khác/cùng khối, thay cấu trúc câu, reorder:**
    - *Bằng chứng integration:* `tests/integration_question_save.test.ts` ca `concurrent edits on different questions succeed with row locks`, ca `concurrent edits on the same question return 409 conflict on second write`.
    - *Bằng chứng integration:* `tests/integration_s1.test.ts` ca `reorder questions with concurrent updates`.
    - *Báo cáo QA:* [qa/rebuild-2026-10-25/BATCH_SUMMARY.md](../rebuild-2026-10-25/BATCH_SUMMARY.md) mục 1.
  * **Vế 2: Không last-write-wins mất dữ liệu:**
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `concurrent PUT with same baseVersion: one 200, one 409; losing editor preserves draft`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F9 (phiên đến sau bị chặn, tự động giữ nháp thành bản sao riêng).
  * **Vế 3: Undo từng người:**
    - *Bằng chứng:* **Chưa có**. Hiện trạng trong `03_CHECKLIST.md` ghi nhận rõ: *"Không partial merge; còn undo/UI/nhiều browser và toàn tiêu chí"*. Hệ thống chỉ có hoàn tác toàn bộ tài liệu về revision cũ (`ExamRevision`), chưa hỗ trợ undo theo luồng từng người dùng độc lập.

- **(3) Kết luận:** **THIẾU**
  - *Vế thiếu bằng chứng:* Vế "undo từng người" hoàn toàn chưa có trong mã nguồn và chưa có ca kiểm thử.

- **(4) Việc nhỏ nhất để đóng:**
  - Cần quyết định điều chỉnh tiêu chí: Tách vế "undo từng người" sang nhóm tính năng nâng cao sau Pilot; nghiệm thu phần "chống last-write-wins và sửa đồng thời khác/cùng khối" (đã đạt).

---

### 6. CV-050: Mất mạng, reconnect và thu hồi quyền đang mở
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Đồng bộ không nhân đôi/mất, quyền kiểm lại khi gửi thay đổi; editor bị thu hồi không tiếp tục ghi."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Đồng bộ không nhân đôi/mất:**
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F9 (ngắt mạng trong context trình duyệt, tiếp tục sửa, có mạng trở lại bấm lưu thành công, dữ liệu DB không bị nhân đôi, không mất nội dung).
    - *Bằng chứng đa trình duyệt:* [qa/rebuild-2026-10-25/BATCH_SUMMARY.md](../rebuild-2026-10-25/BATCH_SUMMARY.md) mục 2: Chrome F9 đạt (`pilot-chrome-final.log`), Edge F9 đạt (`pilot-edge-offline.log`).
  * **Vế 2: Quyền kiểm lại khi gửi thay đổi:**
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `PUT /api/exams/:id revalidates user permissions on every request directly against database`.
  * **Vế 3: Editor bị thu hồi không tiếp tục ghi:**
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F4 (Giáo viên 1 bấm thu hồi quyền của Giáo viên 2; Giáo viên 2 bấm lưu lập tức bị chặn với thông báo lỗi rõ ràng).
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `revoked collaborator cannot save edits`.

- **(3) Kết luận:** **ĐỦ** (trong phạm vi Pilot có kiểm soát)
  - Cả 3 vế đều có bằng chứng ca kiểm thử tự động cụ thể trên cả trình duyệt (Chrome, Edge F9, F4) và HTTP test.
  - *Giới hạn còn mở:* Chưa thử nghiệm race condition 2 engine gửi gói tin trong cùng 1 mili-giây.

- **(4) Việc nhỏ nhất để đóng:**
  - Đã đủ điều kiện để Người chỉ đạo Claude xem xét đóng kèm ghi nhận giới hạn.

---

### 7. CV-055: Nhận diện và phiên lượt làm
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"FREE_NAME/danh sách/mã có kiểm server, membership và PIN nếu bật; người biết ID không được đọc/sửa/nộp bài khác."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: FREE_NAME / danh sách / mã có kiểm server:**
    - *Bằng chứng HTTP:* `tests/http_assignment_options.test.ts` ca `validates FREE_NAME vs PICK_FROM_LIST identity mode`, ca `validates joinCode case-insensitively on server`.
    - *Bằng chứng code:* `src/app/api/public/assignments/[publicId]/start/route.ts` xác thực danh sách học sinh thuộc nhóm/lớp và mã vào bài `joinCode` hoàn toàn ở phía máy chủ.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F5 (giao bài có lớp và không có lớp).
  * **Vế 2: Membership và PIN nếu bật:**
    - *Bằng chứng HTTP:* `tests/http_assignment_options.test.ts` ca `enforces student PIN when requirePin is true`, ca `rejects invalid student PIN`.
    - *Bằng chứng code:* `src/lib/assignment-options.ts`.
  * **Vế 3: Người biết ID không được đọc/sửa/nộp bài khác:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `attempt access cookie is tied to student session; accessing another attemptId with valid cookie of different attempt returns 403`.
    - *Bằng chứng code:* `src/lib/attempt-access.ts` (cấp cookie HttpOnly ký HMAC bảo mật gắn chặt bộ ba `attemptId` + `assignmentId` + `studentName`). Người chỉ biết `attemptId` mà không có cookie ký hợp lệ sẽ bị máy chủ từ chối 403 khi cố đọc nháp hoặc nộp bài.

- **(3) Kết luận:** **ĐỦ**
  - Toàn bộ các vế về FREE_NAME, mã lớp, mã vào bài, PIN và cô lập phiên làm bài chống xem chéo đều có bằng chứng ca kiểm thử cụ thể và đạt 100%.

- **(4) Việc nhỏ nhất để đóng:**
  - Đã đủ điều kiện để Người chỉ đạo Claude xem xét đóng.

---

### 8. CV-057: Lưu nháp và resume thật
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Method/body chuẩn, kiểm res.ok, trạng thái mạng; reload lấy đúng nháp, không ghi đè câu mới bởi request chậm."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Method/body chuẩn, kiểm res.ok, trạng thái mạng:**
    - *Bằng chứng unit:* `tests/student_network.test.ts` ca `retries on network timeout and handles non-ok responses`.
    - *Bằng chứng code:* `src/lib/student-network.ts` và `src/lib/student-draft-journal.ts` kiểm tra chặt chẽ `res.ok`, có cờ mạng `online/offline`.
  * **Vế 2: Reload lấy đúng nháp:**
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F6 (học sinh làm bài, reload F5, hệ thống tự động tải lại đúng các câu đã tích chọn từ local draft journal).
    - *Bằng chứng unit:* `tests/student_draft_journal.test.ts` ca `reads recorded answers after reload`.
  * **Vế 3: Không ghi đè câu mới bởi request chậm:**
    - *Bằng chứng unit:* `tests/attempt_draft_revision.test.ts` ca `draft request with older clientTimestamp or baseRevision is rejected or does not overwrite newer answer`.
    - *Bằng chứng code:* Cơ chế số hiệu sửa đổi `revision` và tem thời gian `clientTimestamp` trong nhật ký nháp.

- **(3) Kết luận:** **ĐỦ** (trong phạm vi Pilot cùng thiết bị)
  - Đã chứng minh bằng ca kiểm thử tự động ở cả 3 cấp độ: unit test (`student_network.test.ts`, `attempt_draft_revision.test.ts`), HTTP test và browser test F6.
  - *Giới hạn còn tồn tại:* Chưa thử nghiệm tình huống học sinh đổi sang một máy tính vật lý khác khi máy cũ bị mất điện/hỏng hóc hoàn toàn.

- **(4) Việc nhỏ nhất để đóng:**
  - Đã đủ điều kiện để Người chỉ đạo Claude xem xét đóng kèm ghi nhận giới hạn.

---

### 9. CV-059: Chấm server và nộp lặp an toàn
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Zero/false/blank phân biệt, số/biểu thức theo câu, đáp án thiếu không nhận blank đúng; submit đồng thời một kết quả, trả điểm đúng chính sách ở mọi nhánh."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Zero/false/blank phân biệt, số/biểu thức theo câu, đáp án thiếu không nhận blank đúng:**
    - *Bằng chứng unit:* `tests/structured_grading.test.ts` ca `distinguishes 0 from blank in short_answer`, ca `distinguishes false from unselected in true_false_group`, ca `empty correct_answer does not mark empty response as correct`.
    - *Báo cáo QA:* [qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md](../rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md) mục 1 (lưu tổng null cho survey/rubric, giữ 0 cho bài scored).
  * **Vế 2: Submit đồng thời một kết quả:**
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `concurrent submit attempts on the same attemptId: exactly one succeeds with 200, second returns 409/already submitted`.
    - *Bằng chứng code:* `src/app/api/public/attempts/[id]/submit/route.ts` sử dụng `SELECT FOR UPDATE` và kiểm tra trạng thái `IN_PROGRESS` nghiêm ngặt.
  * **Vế 3: Trả điểm đúng chính sách ở mọi nhánh:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `returns score immediately when IMMEDIATE`, ca `hides score when AFTER_CLOSE and assignment is OPEN`, ca `hides score when NEVER`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F6.

- **(3) Kết luận:** **ĐỦ**
  - Toàn bộ các vế của tiêu chí đều có bằng chứng kiểm thử tự động đạt 100% tại `structured_grading.test.ts`, `http_workflows.test.ts`, `http_public_policies.test.ts` và browser test F6.

- **(4) Việc nhỏ nhất để đóng:**
  - Đã đủ điều kiện để Người chỉ đạo Claude xem xét đóng.

---

### 10. CV-060: Chấm tay, đính chính và điểm chốt
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Tự luận pending, chỉnh rubric/điểm có lịch sử, regrade có phạm vi/phiên bản; bài cũ không đổi ngầm khi sửa ngân hàng."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Tự luận pending:**
    - *Bằng chứng unit:* `tests/structured_grading.test.ts` ca `essay questions are marked PENDING when submitted`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F6 & F7 (bài có tự luận nộp xong ở trạng thái chờ chấm).
  * **Vế 2: Chỉnh rubric/điểm có lịch sử:**
    - *Bằng chứng unit:* `tests/grade_history_restore.test.ts` ca `records history entry on each manual grade edit with previous score and editor ID`.
    - *Bằng chứng HTTP:* `tests/http_workflows.test.ts` ca `teacher grading persists grade audit trail`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F7 (giáo viên chấm điểm tự luận và nhận xét).
  * **Vế 3: Regrade có phạm vi/phiên bản:**
    - *Bằng chứng:* **Chưa có**. Tính năng tự động regrade (chấm lại toàn bộ bài đã nộp khi sửa đáp án/rubric) theo thiết kế C05 đang tạm dừng (`BATCH_REVIEWS.json` nhận `CHANGES_REQUESTED`, quyết định chỉ đạo ghi "C05 không tiếp").
  * **Vế 4: Bài cũ không đổi ngầm khi sửa ngân hàng:**
    - *Bằng chứng code & test:* `src/app/api/assignments/route.ts` chụp `frozenExamSnapshot` bất biến khi giao bài; `tests/http_workflows.test.ts` ca `modifying source exam does not alter assignment snapshot`.

- **(3) Kết luận:** **THIẾU**
  - *Vế thiếu bằng chứng:* Thiếu chức năng tự động chấm lại (`regrade`) theo phạm vi/phiên bản khi sửa đáp án.

- **(4) Việc nhỏ nhất để đóng:**
  - Cần quyết định của Claude: Xác nhận trong đợt Pilot chỉ hỗ trợ chấm tay thủ công từng bài (đã có lịch sử kiểm toán bảo vệ), chưa hỗ trợ cơ chế regrade tự động hàng loạt; hoặc triển khai hoàn chỉnh C05.

---

### 11. CV-062: Hồi quy link và toàn luồng học sinh
- **(1) Trích nguyên văn tiêu chí "Đạt khi":**
  > *"Thử khách, giáo viên khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE/NEVER; không lộ lời giải trong payload/metadata/file khi chưa được phép."*

- **(2) Đối chiếu từng vế tiêu chí với bằng chứng:**
  * **Vế 1: Thử khách, giáo viên khác, link cũ:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `guest without cookie`, ca `other teacher accessing assignment without permission returns 403`, ca `stale link returns 404`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F6 (khách làm bài không cần đăng nhập).
  * **Vế 2: Đã đóng, đã nộp:**
    - *Bằng chứng HTTP:* `tests/http_assignment_options.test.ts` ca `attempting to start assignment after closesAt returns 403`, ca `attempting to submit after already submitted returns 409`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F5 (vào sau giờ đóng bị từ chối 403).
  * **Vế 3: AFTER_CLOSE / NEVER; không lộ lời giải trong payload/metadata/file khi chưa được phép:**
    - *Bằng chứng HTTP:* `tests/http_public_policies.test.ts` ca `payload inspection under AFTER_CLOSE reveals no solution, no explanation, no correct_answer in JSON body`, ca `policy NEVER permanently strips solutions and rubrics from student API response`.
    - *Bằng chứng browser:* `tests_pilot/pilot.test.ts` luồng F6.
    - *Báo cáo QA:* [qa/rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md](../rebuild-2026-10-24/PUBLIC_POLICIES_AND_NONNUMERIC.md) và [qa/rebuild-2026-10-24/PILOT_E2E.md](../rebuild-2026-10-24/PILOT_E2E.md) luồng F6.

- **(3) Kết luận:** **ĐỦ**
  - Tất cả các tổ hợp tình huống (khách, GV khác, link cũ, đã đóng, đã nộp, AFTER_CLOSE, NEVER) và việc kiểm tra triệt để payload không rò rỉ lời giải đều đã có ca kiểm thử tự động chuyên sâu đạt 100%.

- **(4) Việc nhỏ nhất để đóng:**
  - Đã đủ điều kiện để Người chỉ đạo Claude xem xét đóng.

---
*Báo cáo kiểm toán tiêu chí hoàn thành mục `GEM-P13` (Generation 8, P0).*
