# BỘ 20 TÌNH HUỐNG KIỂM THỬ TÍNH NĂNG SỬA ĐÁP ÁN VÀ CHẤM LẠI (REGRADE)
*Tài liệu đặc tả ca thử nghiệm chuyên sâu dành cho Kỹ sư Codex xây dựng bộ test tự động*
*Căn cứ mã nguồn: `src/lib/answer-correction.ts` và `src/app/api/teacher/assignments/[id]/regrade/route.ts`*

- **Người thực hiện:** Gemini (QA & Logic Tester)
- **Nhiệm vụ:** GEM-R4 (P1, Generation 10)
- **Thời điểm lập (UTC):** 2026-10-25T10:25:00Z
- **Yêu cầu bắt buộc:** Tính toán tay chính xác từng con số điểm số trước và sau của từng bài làm, phân tích mã phản hồi HTTP, trạng thái khóa bi quan và nhật ký kiểm toán.

---

## MÔ HÌNH DỮ LIỆU ĐỀ THI MẪU DÙNG CHO CÁC CA THỬ

Một đề thi kiểm tra 45 phút gồm 5 câu hỏi với tổng điểm tối đa là **10.0 điểm**:
- **Câu 1 (Q1):** Trắc nghiệm 4 lựa chọn (MULTIPLE_CHOICE), 2.0 điểm. Các lựa chọn: A, B, C, D. Đáp án gốc: **A**.
- **Câu 2 (Q2):** Trắc nghiệm 4 lựa chọn (MULTIPLE_CHOICE), 2.0 điểm. Các lựa chọn: A, B, C, D. Đáp án gốc: **C**.
- **Câu 3 (Q3):** Trả lời ngắn số học (SHORT_ANSWER), 2.0 điểm. Đáp án gốc: accepted_answers gồm giá trị 0.5.
- **Câu 4 (Q4):** Điền khuyết từ ngữ (FILL_BLANK), 2.0 điểm. Đáp án gốc: accepted_answers gồm từ hydrogen.
- **Câu 5 (Q5):** Tự luận (ESSAY), 2.0 điểm. Chấm tay bởi giáo viên.

### Danh sách 4 học sinh thử nghiệm:
1. **Học sinh 1 (Nguyễn Văn An):**
   - Bài làm: Q1 = A, Q2 = C, Q3 = 0.5, Q4 = hydrogen, Q5 = đã được chấm tay đạt 2.0 điểm.
   - Điểm số ban đầu: Q1 (2.0) + Q2 (2.0) + Q3 (2.0) + Q4 (2.0) + Q5 (2.0) = **10.0 điểm**.
2. **Học sinh 2 (Trần Thị Bình):**
   - Bài làm: Q1 = B, Q2 = C, Q3 = 1/2, Q4 = HYDROGEN, Q5 = đã được chấm tay đạt 1.0 điểm.
   - Điểm số ban đầu: Q1 (0.0) + Q2 (2.0) + Q3 (0.0 vì chưa có 1/2) + Q4 (2.0 vì không phân biệt hoa thường) + Q5 (1.0) = **5.0 điểm**.
3. **Học sinh 3 (Lê Văn Chi):**
   - Bài làm: Q1 = A, Q2 = D, Q3 = 0,5, Q4 = oxygen, Q5 = đã được chấm tay đạt 1.5 điểm.
   - Đặc biệt tại Q1: Giáo viên đã vào chấm tay đè điểm (manualScore = 1.0 điểm kèm nhận xét riêng).
   - Điểm số ban đầu: Q1 (1.0 chấm tay) + Q2 (0.0) + Q3 (2.0 do 0,5 khớp 0.5) + Q4 (0.0) + Q5 (1.5) = **4.5 điểm**.
4. **Học sinh 4 (Phạm Quốc Dũng):**
   - Bài làm: Q1 để trống, Q2 = C, Q3 để trống, Q4 để trống, Q5 = chưa chấm (0.0).
   - Điểm số ban đầu: Q1 (0.0) + Q2 (2.0) + Q3 (0.0) + Q4 (0.0) + Q5 (0.0) = **2.0 điểm**.

---

## DANH SÁCH 20 TÌNH HUỐNG KIỂM THỬ CHI TIẾT

### TC01: Đổi đáp án đúng trắc nghiệm từ A sang B (Q1)
- **Mục tiêu:** Kiểm tra chấm lại câu hỏi trắc nghiệm một đáp án khi có học sinh tăng điểm và học sinh giảm điểm.
- **Dữ liệu vào:** questionKey = **Q1**, correctAnswer = **B**, reason = **Đính chính đáp án câu 1 từ A sang B theo tổ chuyên môn**, preview = false.
- **Tính toán điểm số từng bài:**
  + Học sinh 1 (An): Q1 từ A thành sai (0.0). Điểm trước: 10.0 -> Điểm sau: **8.0** (giảm 2.0 đ).
  + Học sinh 2 (Bình): Q1 chọn B thành đúng (2.0). Điểm trước: 5.0 -> Điểm sau: **7.0** (tăng 2.0 đ).
  + Học sinh 3 (Chi): Q1 có manualScore = 1.0, được giữ nguyên. Điểm trước: 4.5 -> Điểm sau: **4.5** (không đổi).
  + Học sinh 4 (Dũng): Q1 bỏ trống. Điểm trước: 2.0 -> Điểm sau: **2.0** (không đổi).
- **Kết quả mong đợi:** HTTP 200, success = true, submitted = 4, changed có độ dài bằng 2 (An và Bình), keptManual = 1 (Chi), unchanged = 1 (Dũng).

### TC02: Bảo toàn tuyệt đối điểm bài đã chấm tay (manualScore)
- **Mục tiêu:** Xác minh nhánh kiểm tra manualScore khác null trong `src/lib/answer-correction.ts` giữ nguyên điểm giáo viên đã chấm.
- **Dữ liệu vào:** questionKey = **Q1**, correctAnswer = **C**, reason = **Đổi đáp án Q1 sang C**, preview = false.
- **Tính toán điểm số từng bài:**
  + Học sinh 3 (Chi) dù chọn A (trước đây đúng, nay sai) nhưng đã có manualScore = 1.0 thì điểm câu này không bị tính lại thành 0.0, tổng điểm giữ nguyên 4.5.
- **Kết quả mong đợi:** keptManual tăng lên 1, bài của Chi không nằm trong mảng changed.

### TC03: Học sinh bỏ trống câu hỏi (Response rỗng hoặc null)
- **Mục tiêu:** Xác minh học sinh không trả lời câu hỏi thì không bị tính toán sai lệch hay phát sinh lỗi logic.
- **Dữ liệu vào:** questionKey = **Q1**, correctAnswer = **B**, preview = false.
- **Tính toán điểm số từng bài:**
  + Học sinh 4 (Dũng): chuỗi trả lời rỗng. Sau khi đổi đáp án sang B, điểm mới đạt 0.0, bằng với điểm cũ 0.0.
- **Kết quả mong đợi:** unchanged tăng lên, điểm Dũng giữ nguyên 2.0, không ghi nhận nhật ký attempt.grade cho Dũng.

### TC04: Chế độ xem trước ảnh hưởng (Preview Mode) không ghi cơ sở dữ liệu
- **Mục tiêu:** Kiểm tra cờ preview = true trả về danh sách biến động điểm nhưng tuyệt đối không sửa đổi snapshot hay attempt.
- **Dữ liệu vào:** questionKey = **Q1**, correctAnswer = **B**, reason = **Xem thử biến động điểm**, preview = true.
- **Tính toán điểm số:**
  + An: scoreBefore = 10.0, scoreAfter = 8.0.
  + Bình: scoreBefore = 5.0, scoreAfter = 7.0.
- **Kết quả mong đợi:** HTTP 200, preview = true, message phản hồi là **Xem trước: chưa ghi gì**. Revision trả về giữ nguyên baseCorrectionRevision. Đọc lại cơ sở dữ liệu xác nhận điểm An trên DB vẫn là 10.0 và đáp án Q1 trên DB vẫn là A.

### TC05: Xung đột phiên bản CAS (Correction Revision Conflict - HTTP 409)
- **Mục tiêu:** Kiểm tra cơ chế chống hai giáo viên cùng sửa đè đáp án tại một thời điểm.
- **Dữ liệu vào:** Giáo viên A và B cùng mở màn hình sửa Q1 với revision ban đầu REV_INIT. Giáo viên A gửi sửa thành công sang B làm revision đổi thành REV_NEW. Sau đó Giáo viên B gửi yêu cầu với baseCorrectionRevision mang giá trị cũ REV_INIT.
- **Kết quả mong đợi:** Máy chủ trả về mã lỗi HTTP 409 với mã định danh `CORRECTION_CONFLICT` và thông báo tiếng Việt báo đáp án đã được sửa ở trang khác.

### TC06: Chuẩn hóa dấu phẩy và dấu chấm trong số thập phân (0,5 và 0.5)
- **Mục tiêu:** Kiểm tra hàm normalize trong `src/lib/attempt-grading.ts` coi dấu phẩy tương đương dấu chấm.
- **Dữ liệu vào:** questionKey = **Q3**, acceptedAnswers gồm hai phần tử 0.5 và 1/2, reason = **Bổ sung dạng phân số cho câu 3**, preview = false.
- **Tính toán điểm số từng bài:**
  + Học sinh 3 (Chi) trả lời 0,5: trước đây đã được chuẩn hóa thành 0.5 (đúng, 2.0 đ), nay vẫn đúng (2.0 đ) -> unchanged.
  + Học sinh 2 (Bình) trả lời 1/2: trước đây nhận 0.0 đ, nay nhận 2.0 đ -> Điểm trước: 5.0 -> Điểm sau: **7.0**.
- **Kết quả mong đợi:** Bình đổi điểm từ 5.0 lên 7.0, Chi không đổi điểm.

### TC07: Bổ sung nhiều phương án chấp nhận cho câu trả lời ngắn (Q3)
- **Mục tiêu:** Mở rộng mảng acceptedAnswers từ 1 phần tử lên 3 phần tử gồm 0.5, 1/2, nửa.
- **Dữ liệu vào:** questionKey = **Q3**, acceptedAnswers = [0.5, 1/2, nửa], reason = **Chấp nhận cả cách viết chữ và phân số**, preview = false.
- **Tính toán điểm số:**
  + Bình (trả lời 1/2) được cộng 2.0 điểm. Điểm tổng tăng từ 5.0 lên 7.0.
- **Kết quả mong đợi:** HTTP 200, snapshot câu hỏi Q3 chứa đủ 3 chuỗi chấp nhận.

### TC08: Không phân biệt chữ hoa chữ thường trong câu điền khuyết (Q4)
- **Mục tiêu:** Kiểm tra câu điền khuyết không bị ảnh hưởng bởi việc giáo viên gõ hoa hay thường khi đính chính.
- **Dữ liệu vào:** questionKey = **Q4**, acceptedAnswers gồm HYDROGEN (viết hoa toàn bộ), preview = false.
- **Tính toán điểm số:**
  + An (trả lời hydrogen) và Bình (trả lời HYDROGEN) đều được chuẩn hóa so sánh không phân biệt hoa thường -> Cả 2 em đều đạt 2.0 điểm, không em nào bị trừ điểm.
- **Kết quả mong đợi:** unchanged bao gồm cả An và Bình.

### TC09: Câu hỏi có điểm số bằng 0 (points = 0)
- **Mục tiêu:** Kiểm tra câu hỏi phụ hoặc câu thưởng có cấu hình 0 điểm khi đổi đáp án không làm lệch tổng điểm bài thi.
- **Dữ liệu vào:** Một câu hỏi phụ có points = 0, ban đầu đúng là A, đổi sang B.
- **Tính toán điểm số:**
  + Trước: earned = 0.0, maxPoints = 0.0. Sau: earned = 0.0, maxPoints = 0.0.
- **Kết quả mong đợi:** Điểm mới bằng điểm cũ, bài thi được tính vào danh sách unchanged, tổng điểm các học sinh giữ nguyên.

### TC10: Từ chối sửa đáp án câu hỏi ghép nối (MATCHING) - HTTP 422
- **Mục tiêu:** Kiểm tra chặn câu hỏi dạng thức không hỗ trợ tự động chấm lại.
- **Dữ liệu vào:** questionKey trỏ tới một câu có type = **MATCHING**, correctAnswer = **m1**, reason = **Sửa câu ghép nối**.
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 422 với mã lỗi `REGRADE_TYPE_UNSUPPORTED`.

### TC11: Từ chối sửa đáp án câu hỏi sắp xếp (ORDERING) - HTTP 422
- **Mục tiêu:** Kiểm tra chặn câu hỏi dạng ORDERING.
- **Dữ liệu vào:** questionKey trỏ tới câu type = **ORDERING**, acceptedAnswers = [1, 2].
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 422 với mã lỗi `REGRADE_TYPE_UNSUPPORTED`.

### TC12: Từ chối sửa đáp án câu hỏi Đúng/Sai nhóm (TRUE_FALSE_GROUP) - HTTP 422
- **Mục tiêu:** Câu chùm đúng sai có cơ chế chấm điểm lũy tiến phức tạp, hệ thống yêu cầu giáo viên chấm tay khi cần điều chỉnh.
- **Dữ liệu vào:** questionKey trỏ tới câu type = **TRUE_FALSE_GROUP**, correctAnswer = **Đ,S,Đ,S**.
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 422 với mã lỗi `REGRADE_TYPE_UNSUPPORTED`.

### TC13: Từ chối sửa đáp án câu hỏi tự luận (ESSAY) - HTTP 422
- **Mục tiêu:** Câu tự luận không có đáp án tự chấm đóng gói, không thuộc danh mục regradable.
- **Dữ liệu vào:** questionKey trỏ tới Q5 có type = **ESSAY**.
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 422 với mã lỗi `REGRADE_TYPE_UNSUPPORTED`.

### TC14: Từ chối phương án trắc nghiệm không hợp lệ (Không thuộc danh sách A/B/C/D)
- **Mục tiêu:** Kiểm tra tính toàn vẹn của phương án chọn trong câu trắc nghiệm.
- **Dữ liệu vào:** questionKey = **Q1**, correctAnswer = **E** (trong khi câu hỏi chỉ có các lựa chọn A, B, C, D).
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 400 thông báo đáp án đúng phải thuộc danh sách các lựa chọn của câu.

### TC15: Từ chối lý do đính chính dưới 3 ký tự
- **Mục tiêu:** Kiểm tra xác thực bắt buộc nhập lý do có ý nghĩa để lưu vết kiểm toán sư phạm.
- **Dữ liệu vào:** questionKey = **Q1**, correctAnswer = **B**, reason = **OK** (chỉ có 2 ký tự).
- **Kết quả mong đợi:** Xác thực Zod thất bại, trả về HTTP 400 thông báo dữ liệu sửa đáp án không hợp lệ.

### TC16: Từ chối mảng đáp án chấp nhận rỗng
- **Mục tiêu:** Kiểm tra không cho phép xóa sạch toàn bộ đáp án của câu trả lời ngắn.
- **Dữ liệu vào:** questionKey = **Q3**, acceptedAnswers rỗng, reason = **Xóa đáp án câu 3**.
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 400 yêu cầu phải có từ 1 đến 20 đáp án chấp nhận.

### TC17: Từ chối mảng đáp án chấp nhận vượt quá 20 phần tử
- **Mục tiêu:** Ngăn chặn lạm dụng làm phình to payload cấu trúc câu hỏi.
- **Dữ liệu vào:** questionKey = **Q3**, acceptedAnswers gồm 21 chuỗi khác nhau.
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 400 yêu cầu phải có từ 1 đến 20 đáp án chấp nhận.

### TC18: Yêu cầu sửa câu hỏi không tồn tại trong đề (HTTP 404)
- **Mục tiêu:** Kiểm tra xử lý mã định danh câu hỏi giả mạo hoặc không có trong bài.
- **Dữ liệu vào:** questionKey không tồn tại trong snapshot, correctAnswer = **A**, reason = **Sửa câu ma**.
- **Kết quả mong đợi:** Ném ngoại lệ ApiError 404 thông báo câu hỏi không có trong bản đề đã giao.

### TC19: Chuỗi sửa đáp án nhiều lần liên tiếp (Lịch sử lũy tích)
- **Mục tiêu:** Kiểm tra trường corrections trong snapshot ghi nhận mảng lịch sử tăng dần qua từng lần sửa.
- **Dữ liệu vào:**
  + Lần 1: Sửa Q1 từ A sang B (Lý do: Đính chính lần 1). Điểm An: 10.0 -> 8.0; Bình: 5.0 -> 7.0.
  + Lần 2: Sửa Q1 từ B sang C (Lý do: Đính chính lần 2).
- **Tính toán điểm số sau Lần 2:**
  + Cả An (chọn A) và Bình (chọn B) đều sai ở Q1 (0.0 đ).
  + An: Q1 (0.0) + Q2 (2.0) + Q3 (2.0) + Q4 (2.0) + Q5 (2.0) = **8.0 điểm**.
  + Bình: Q1 (0.0) + Q2 (2.0) + Q3 (0.0) + Q4 (2.0) + Q5 (1.0) = **5.0 điểm**.
- **Kết quả mong đợi:** Mảng corrections của câu hỏi Q1 có 2 bản ghi; mã băm revision sau lần 2 tính cả chiều dài mảng lịch sử nên khác hoàn toàn revision sau lần 1.

### TC20: Đợt giao bài chưa có học sinh nào nộp bài (submitted = 0)
- **Mục tiêu:** Giáo viên phát hiện sai và sửa đáp án trước khi bất kỳ học sinh nào hoàn thành bài.
- **Dữ liệu vào:** Đợt bài giao mới tạo, danh sách bài nộp có trạng thái SUBMITTED là rỗng (0 bài). Giáo viên sửa Q1 từ A sang B.
- **Tính toán kết quả:**
  + submitted = 0, changed rỗng, keptManual = 0, unchanged = 0.
  + snapshot của Assignment được cập nhật đáp án đúng mới là B.
- **Kết quả mong đợi:** HTTP 200, phản hồi báo đã cập nhật đáp án. Học sinh nộp bài sau thời điểm này sẽ được chấm tự động theo đáp án B ngay từ đầu.

---
*Tài liệu đặc tả ca thử nghiệm chấm lại phục vụ tự động hóa kiểm thử ExamCraft 2026.*
