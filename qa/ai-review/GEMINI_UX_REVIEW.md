# BÁO CÁO RÀ SOÁT UX VÀ ĐỐI CHIẾU TIÊU CHÍ BÀN GIAO (GEMINI)

- **Người thực hiện:** Gemini (QA Tài liệu / UX)
- **Baseline kiểm tra:** `83d4a95fedd632b69d8d1eedd135dabc10e369ad`
- **Bàn giao Claude được rà soát:** Commit `ca738712aed01604a4d4072733cb9dea33ae8e5b` (nhánh `ai/claude-grade-history`)
- **Đối tượng người dùng mục tiêu:** Giáo viên ít rành CNTT, cá nhân hoặc nhóm chuyên môn nhỏ; học sinh phổ thông làm bài thi trực tuyến đa thiết bị (máy tính, điện thoại, máy tính bảng).
- **Phạm vi mã nguồn rà soát:** Các luồng chia sẻ/giao/xem/chấm của giáo viên và vào/làm/khôi phục/xung đột/nộp của học sinh (tập trung CV048, CV057, CV058, CV060, CV061, CV077).

---

## I. ĐỐI CHIẾU TIÊU CHÍ VỚI BẰNG CHỨNG THỰC TẾ (CRITERIA VS EVIDENCE)

| Mã CV | Tiêu chí nghiệp vụ | Bằng chứng mã nguồn / Kiểm thử | Đối chiếu & Phát hiện mâu thuẫn |
| :--- | :--- | :--- | :--- |
| **CV057** | Giáo viên chia sẻ đề thi công khai; đồng nghiệp/học sinh có thể xem trước và tải về file Word (`.docx`). | `src/app/share/[id]/page.tsx:155`<br>`src/lib/docx-export.ts:409` | **MÂU THUẪN NGHIÊM TRỌNG:** Nút "Tải file Word (.docx)" gọi `exportExamToDocx(exam)` trả về `Promise<Blob>` nhưng không hề kích hoạt tải file. Người dùng bấm không có phản ứng. |
| **CV058** | Học sinh vào thi trực tuyến theo liên kết bài tập (`/a/[publicId]`). Đường dẫn `/test/[id]` cũ bị bãi bỏ. | `src/app/share/[id]/page.tsx:145`<br>`src/app/test/[id]/page.tsx:11-14` | **MÂU THUẪN LUỒNG:** Trang chia sẻ vẫn chứa nút "Làm bài Online" dẫn đến `/test/[id]`. Khi bấm vào, học sinh bị dẫn tới trang thông báo "Đường dẫn thi cũ không còn được hỗ trợ", gây cụt luồng. |
| **CV060** | Giáo viên xem chi tiết bài làm, điều chỉnh điểm số từng câu và ghi nhận xét bài thi. | `src/app/teacher/assignments/[id]/page.tsx:685-705`<br>`src/app/api/teacher/attempts/[id]/route.ts` | **THIẾU GIAO DIỆN:** API và AuditLog hỗ trợ trường `teacherComment`, nhưng giao diện chỉ có ô sửa điểm, thiếu ô nhập nhận xét. Giáo viên không thể để lại lời phê cho học sinh qua UI. |
| **CV061** | Phân trang lịch sử chấm điểm bằng cursor ổn định (`createdAt` + `id`), mỗi trang 50 mục, có nút xem tiếp. | Commit `ca738712aed0`<br>`src/lib/grade-history-pagination.ts`<br>`tests/grade_history_pagination.test.ts` (6/6 pass) | **ĐẠT YÊU CẦU UX / CẦN CHỈNH BẢO MẬT:** Claude triển khai đúng phạm vi, UX nút "Xem lịch sử cũ hơn" mượt mà. Tuy nhiên API giải mã cursor trước khi kiểm tra quyền sở hữu bài làm, làm rò rỉ mã lỗi 400 thay vì 404. |
| **CV048** | Khôi phục bài làm học sinh từ bộ nhớ tạm local (journal) khi mất điện, đóng tab, đứt mạng. | `src/lib/student-draft-journal.ts`<br>`src/app/a/[publicId]/page.tsx:636-660` | **THIẾU TRẢI NGHIỆM DI ĐỘNG:** Trạng thái lưu nháp bị ẩn trên màn hình điện thoại (`hidden md:flex`). Cảnh báo xung đột cho tải file JSON đối chiếu nhưng không có chỗ nào trên UI để nạp lại file JSON này. |
| **CV077** | Chặn ghi đè nháp khi học sinh mở nhiều tab/thiết bị; trả về 409 CONFLICT và giữ an toàn dữ liệu. | `src/app/api/public/attempts/[id]/draft/route.ts`<br>`src/app/a/[publicId]/page.tsx:520-540` | **BẾ TẮC NỘP BÀI:** Khi nhận lỗi 409, cờ `draftConflictRef.current = true` khóa cứng nút nộp bài. Học sinh bấm "Nộp bài ngay" chỉ nhận alert rồi bị đóng modal, không có đường dẫn khắc phục tiếp theo. |

---

## II. ĐÁNH GIÁ CHI TIẾT BÀN GIAO CỦA CLAUDE (COMMIT `ca738712aed0`)

1. **Phạm vi sửa đổi (Scope Compliance):**
   - Rất tốt, hoàn toàn độc lập trong worktree riêng: chỉ chạm vào `src/lib/grade-history-pagination.ts`, `src/app/api/teacher/attempts/[id]/route.ts`, `src/app/teacher/assignments/[id]/page.tsx` và thêm bộ kiểm thử đơn vị `tests/grade_history_pagination.test.ts`.
   - Không gây xung đột hoặc sửa lan sang các tệp bài tập / nháp mà Codex đang phụ trách.

2. **Trải nghiệm người dùng (UX Review):**
   - Nhãn hiển thị trực quan: `Lịch sử chấm (${shown.length}${hasMore ? '+' : ''})` giúp giáo viên biết ngay đã hiển thị bao nhiêu lần sửa điểm và còn mục cũ hay không.
   - Nút hành động rõ ràng: Nút `"Xem lịch sử cũ hơn"` chuyển sang `"Đang tải..."` khi đang nạp và đổi thành `"Thử lại"` nếu mạng lỗi.
   - Xử lý race-condition tốt: Sử dụng `olderRequestRef` và đối chiếu `selectedAttemptRef` giúp triệt tiêu triệt để tình trạng phản hồi chậm của bài trước chèn đè lên bài đang mở khi giáo viên chuyển nhanh giữa các học sinh.
   - Điểm lưu ý nhỏ: Khi giáo viên điều chỉnh điểm của một câu bất kỳ, hệ thống gọi lại `handleOpenAttemptDetail` khiến danh sách lịch sử thu gọn lại 50 mục gần nhất. Đây là hành vi chấp nhận được để đảm bảo dữ liệu đồng bộ với server, không phải lỗi.

3. **Lỗ hổng thứ tự xác thực (Security Ordering Flaw):**
   - Trong `src/app/api/teacher/attempts/[id]/route.ts` (dòng 26-28): Gọi `decodeGradeHistoryCursor(rawCursor, id)` trước khi kiểm tra `prisma.attempt.findFirst({ where: { id, assignment: { ownerId: user.id } } })`.
   - Nếu kẻ tấn công truyền cursor sai cấu trúc cho một bài làm không thuộc sở hữu của mình, hệ thống trả về `400 HISTORY_CURSOR_INVALID` thay vì `404 Không tìm thấy bài làm`. Codex đã phát hiện và cần áp dụng sửa đổi đảo thứ tự kiểm tra `ownerId` lên trước.

---

## III. TOP 10 PHÁT HIỆN UX & LOGIC NGHIỆP VỤ

### 1. [Xác thực] Nút "Tải file Word (.docx)" ở trang chia sẻ không hoạt động (No-Op)
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/share/[id]/page.tsx#L154-L159)
- **Tình huống:** Giáo viên nhận link chia sẻ đề thi `/share/[id]`, bấm nút "Tải file Word (.docx)".
- **Tác động:** Hàm `exportExamToDocx(exam)` trả về `Promise<Blob>` nhưng không có mã lệnh tạo URL và kích hoạt tải xuống trình duyệt. Người dùng bấm liên tục nhưng không thấy tệp tải về, cho rằng hệ thống bị treo.
- **Sửa nhỏ nhất:** Bổ sung logic tạo thẻ `<a>` và tải blob tương tự như trong `src/components/A4Preview.tsx`:
  ```typescript
  const blob = await exportExamToDocx(exam);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exam.metadata.title || 'DeThi'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  ```

### 2. [Xác thực] Nút "Làm bài Online" ở trang chia sẻ dẫn vào ngõ cụt `/test/[id]`
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/share/[id]/page.tsx#L144-L152) và [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/test/[id]/page.tsx#L11-L15)
- **Tình huống:** Giáo viên gửi link `/share/[id]` cho học sinh làm bài; học sinh bấm "Làm bài Online".
- **Tác động:** Nút dẫn tới route `/test/[id]`. Route này hiện hiển thị màn hình cảnh báo "Đường dẫn thi cũ không còn được hỗ trợ... Hãy hỏi giáo viên để được cấp liên kết mới (/a/...)". Học sinh hoang mang, tưởng đề thi bị xóa hoặc giáo viên cấp sai link.
- **Sửa nhỏ nhất:** Ẩn nút "Làm bài Online" trên trang `/share/[id]`, thay bằng chú thích: *"Đây là bản xem và in đề. Để học sinh làm bài thi trực tuyến và chấm điểm, giáo viên vui lòng Giao đề trong trang quản lý để lấy liên kết /a/..."*.

### 3. [Xác thực] Thiếu ô nhập lời phê / nhận xét trong giao diện chấm bài của giáo viên
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/teacher/assignments/[id]/page.tsx#L685-L705)
- **Tình huống:** Giáo viên mở bài thi của học sinh để chấm tay câu tự luận / trả lời ngắn và muốn để lại phản hồi lý do trừ điểm.
- **Tác động:** API `POST /api/teacher/attempts/[id]` và lịch sử chấm đều hỗ trợ `teacherComment`, nhưng trên UI chỉ có ô nhập số điểm `q.earned`. Giáo viên không có cách nào ghi lời phê hay giải thích lỗi sai cho học sinh.
- **Sửa nhỏ nhất:** Thêm một trường `<input>` hoặc `<textarea>` nhỏ dưới ô điểm của từng câu để nhập nhận xét, gửi kèm giá trị `teacherComment` khi lưu.

### 4. [Xác thực] Thanh trạng thái lưu nháp bị ẩn trên màn hình điện thoại của học sinh
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/a/[publicId]/page.tsx#L636)
- **Tình huống:** Học sinh làm bài thi bằng điện thoại thông minh (độ phân giải < 768px).
- **Tác động:** Lớp CSS `hidden md:flex` ẩn toàn bộ trạng thái "Đang lưu...", "Đã lưu lúc..." và cảnh báo lỗi lưu màu đỏ `saveError`. Khi mạng rớt hoặc nháp không lưu được, học sinh dùng điện thoại không hề hay biết, đinh ninh đáp án đã được ghi nhận.
- **Sửa nhỏ nhất:** Bỏ `hidden md:flex`, hiển thị một chấm tròn trạng thái hoặc icon đám mây nhỏ gọn cạnh đồng hồ đếm ngược trên giao diện mobile.

### 5. [Xác thực] Tải file nháp JSON khi xung đột nhưng không có cơ chế nạp lại để nộp bài
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/a/[publicId]/page.tsx#L645-L660)
- **Tình huống:** Học sinh gặp xung đột phiên bản nháp (409), bấm nút "Tải bản câu trả lời đang nhập" tải về tệp `examcraft-bai-lam-${attemptId}.json`.
- **Tác động:** Tệp JSON là định dạng kỹ thuật mà học sinh/phụ huynh không thể tự đọc hiểu. Quan trọng hơn, không có bất kỳ nút "Nhập lại nháp từ tệp" nào trên màn hình thi. Học sinh bị khóa nộp bài và hoàn toàn bế tắc.
- **Sửa nhỏ nhất:** Trong khung cảnh báo xung đột, thêm nút "Tiếp tục với đáp án trên máy này và ghi đè" (gửi kèm cờ xác nhận lực chọn ghi đè lên server) hoặc nút nạp tệp JSON để khôi phục nhanh đáp án vào giao diện.

### 6. [Xác thực] Ô nhập điểm chấm bài thiếu ràng buộc min/max và không phục hồi giá trị cũ khi lỗi
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/teacher/assignments/[id]/page.tsx#L685-L695)
- **Tình huống:** Giáo viên gõ nhầm điểm âm hoặc điểm lớn hơn điểm tối đa của câu (ví dụ nhập 5 cho câu 1 điểm) rồi click chuột ra ngoài.
- **Tác động:** Ô `<input type="number">` không có thuộc tính `min="0"` và `max={q.points}`. Server trả về lỗi 400 (`Điểm không hợp lệ...`), nhưng ô input vẫn giữ nguyên số sai vừa gõ, không tự reset về điểm cũ, khiến giáo viên tưởng số điểm sai đó đã được chấp nhận.
- **Sửa nhỏ nhất:** Thêm `min={0}` và `max={q.points}` vào thuộc tính thẻ `<input>`, và trong khối `catch` của `handleSaveGrade`, tự động gán lại giá trị ô input về `q.earned`.

### 7. [Xác thực] Cờ lưu điểm `savingGrade` dùng chung làm vô hiệu hóa và nhấp nháy toàn bộ câu hỏi
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/teacher/assignments/[id]/page.tsx#L128, #L686, #L702)
- **Tình huống:** Đề thi có 40 câu hỏi, giáo viên đang chấm điểm cho Câu 1.
- **Tác động:** Biến `savingGrade` là boolean duy nhất cho toàn modal. Khi Câu 1 đang lưu, cả 40 câu hỏi đều đồng loạt hiển thị "Đang lưu điểm..." và bị disable ô nhập. Giáo viên dễ nhầm tưởng hệ thống đang lưu lại tất cả các câu hoặc bị đơ giao diện.
- **Sửa nhỏ nhất:** Thay `savingGrade: boolean` bằng `savingQuestionKey: string | null`, chỉ disable và hiển thị chữ "Đang lưu điểm..." tại đúng câu hỏi tương ứng.

### 8. [Xác thực - Bàn giao Claude] Lộ mã lỗi 400 thay vì 404 khi giải mã cursor trước xác thực quyền
- **Vị trí:** [route.ts](file:///F:/Workspace/Zazz/ExamCraft/src/app/api/teacher/attempts/[id]/route.ts#L25-L28) (commit `ca738712aed0`)
- **Tình huống:** Gửi yêu cầu `GET /api/teacher/attempts/[id]?historyCursor=invalid` với bài làm thuộc giáo viên khác.
- **Tác động:** `decodeGradeHistoryCursor` tung lỗi trước khi kiểm tra bài làm có thuộc tài khoản giáo viên đang đăng nhập không, trả về `400 HISTORY_CURSOR_INVALID` thay vì `404 Không tìm thấy bài làm`.
- **Sửa nhỏ nhất:** Chuyển câu lệnh `findFirst` kiểm tra `ownerId` lên trước khối giải mã cursor.

### 9. [Nghi ngờ có căn cứ] Dùng `alert()` đồng bộ khi nộp bài gây khóa giao diện trên Webview điện thoại
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/a/[publicId]/page.tsx#L547, #L554, #L558)
- **Tình huống:** Học sinh mở bài thi từ liên kết gửi qua Zalo/Facebook Messenger và nộp bài khi hết giờ hoặc mạng yếu.
- **Tác động:** Hàm `alert()` gốc của trình duyệt thường bị các webview trên iOS/Android can thiệp hoặc chặn hoàn toàn, dẫn đến việc học sinh không biết kết quả nộp bài thành công hay thất bại.
- **Sửa nhỏ nhất:** Thay thế `alert()` bằng modal/banner thông báo thuần React hiển thị trực tiếp trong trang.

### 10. [Chưa kiểm] Rủi ro mất phiên làm bài khi chuyển đổi mạng giữa chừng trên thiết bị di động
- **Vị trí:** [page.tsx](file:///F:/Workspace/Zazz/ExamCraft/src/app/a/[publicId]/page.tsx#L85-L130)
- **Tình huống:** Học sinh đang làm bài thì điện thoại tự động chuyển từ Wi-Fi sang 4G (thay đổi địa chỉ IP hoặc gián đoạn kết nối tạm thời).
- **Tác động:** Cần kiểm chứng môi trường thực tế xem token phiên làm bài hoặc cookie xác thực có bị ảnh hưởng khiến hệ thống coi học sinh là phiên làm việc mới hay không.

---

## IV. 5 ƯU TIÊN SỬA ĐỔI CẦN THỰC HIỆN NGAY

1. **Ưu tiên 1 (Chức năng cốt lõi bị liệt):** Sửa nút "Tải file Word (.docx)" tại `src/app/share/[id]/page.tsx` để thực sự tải tệp Word về máy người dùng.
2. **Ưu tiên 2 (Bảo mật & Phân quyền):** Đảo thứ tự xác thực quyền sở hữu `ownerId` trước khi giải mã cursor phân trang trong `src/app/api/teacher/attempts/[id]/route.ts`.
3. **Ưu tiên 3 (Trải nghiệm học sinh di động):** Bỏ `hidden md:flex` để hiển thị trạng thái lưu nháp và lỗi mạng trên điện thoại tại `src/app/a/[publicId]/page.tsx`.
4. **Ưu tiên 4 (Tránh ngõ cụt luồng người dùng):** Ẩn hoặc điều chỉnh liên kết "Làm bài Online" tại `src/app/share/[id]/page.tsx`, giải thích rõ sự khác biệt giữa Xem đề và Giao đề thi.
5. **Ưu tiên 5 (Nghiệp vụ chấm thi):** Bổ sung ô nhập lời phê (`teacherComment`) và thêm ràng buộc `min/max` điểm trong modal chấm của giáo viên tại `src/app/teacher/assignments/[id]/page.tsx`.

---

## V. PHỤ LỤC ĐÍNH CHÍNH & LÀM RÕ (GENERATION 2 ADDENDUM)

1. **Chuẩn hóa ánh xạ mã công việc (CV Mapping):**
   - `CV048`: Chia sẻ đề thi công khai (ShareModal / share page / docx export).
   - `CV057`: Bộ nhớ tạm nháp học sinh tại trình duyệt (Local journal & Recovery).
   - `CV058`: Giao diện và luồng làm bài thi học sinh (`/a/[publicId]`).
   - `CV060`: Chấm bài thi và điều chỉnh điểm số thủ công của giáo viên.
   - `CV061`: Giám sát đợt giao đề, theo dõi tiến độ và bảng điểm (Monitor & Grade History).
   - `CV077`: Dọn dẹp dữ liệu cũ và lưu trữ (Cleanup & Archive).

2. **Nguyên tắc bảo toàn dữ liệu nhập & Cơ chế Compare-And-Swap (CAS):**
   - Không khuyến nghị force-overwrite hoặc bỏ kiểm tra CAS khi có xung đột nháp 409. Khuyến nghị chuẩn mực là bảo toàn dữ liệu câu trả lời học sinh đang nhập trên trình duyệt, hỗ trợ tải tệp nháp đối chiếu và cung cấp tùy chọn nộp bản nháp đã lưu an toàn trên máy chủ (saved-only submission).
   - Ô nhập điểm giáo viên khi lỗi: Giữ nguyên số đang nhập kèm nhãn "Chưa lưu" và nút thử lại; không tự động reset về giá trị cũ để tránh mất công sức nhập liệu của giáo viên. Thuộc tính `min/max` chỉ mang tính hỗ trợ gợi ý UI; kiểm soát hợp lệ bắt buộc nằm ở tầng validation logic/backend.

3. **Phân định giữa rà soát tĩnh và kiểm thử giao diện thực tế (Runtime UI):**
   - Báo cáo này hoàn toàn dựa trên phân tích mã nguồn tĩnh (Static Analysis) tại baseline `83d4a95`. Do công cụ CUA chưa khởi tạo được kernel assets trên môi trường Windows hiện tại, chưa có kết luận nghiệm thu giao diện động (UI runtime).
   - Về mã lỗi 400 và 404: Để chứng minh đầy đủ một endpoint có làm lộ sự tồn tại của tài nguyên (IDOR probe) qua mã lỗi 400 hay không, cần có kiểm chứng đối chiếu với cả trường hợp ID hoàn toàn không tồn tại trong hệ thống.

