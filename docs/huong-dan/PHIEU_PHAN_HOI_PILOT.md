# PHIẾU PHẢN HỒI GIÁO VIÊN THỬ NGHIỆM & BẢNG GHI NHẬN SỰ CỐ (PILOT FEEDBACK & BUG REPORT)
*Dành cho Giáo viên tham gia đợt thử nghiệm hệ thống ExamCraft*
*Căn cứ quy chuẩn luồng kiểm thử F1–F8 tại [THE_KIEM_TAY_PILOT.md](THE_KIEM_TAY_PILOT.md)*

- **Mã tài liệu:** `PILOT-FEEDBACK-01`
- **Nhiệm vụ:** `GEM-P11` thuộc nhiệm vụ `GEMINI-PILOT-PREP` (Generation 7, [ASSIGNMENTS.json](../../qa/ai-review/coordination/ASSIGNMENTS.json))
- **Thời điểm ban hành (UTC):** 2026-10-24T17:00:00Z
- **Đối tượng sử dụng:** Giáo viên bộ môn tham gia thử nghiệm và Người phản biện chuyên môn.

---

> [!IMPORTANT]
> **CAM KẾT BẢO VỆ DỮ LIỆU & QUYỀN RIÊNG TƯ (GDPR / NGHỊ ĐỊNH 13/2023/NĐ-CP):**
> 1. Phiếu khảo sát này **chỉ thu thập phản hồi về mặt trải nghiệm phần mềm, tính tiện dụng sư phạm và lỗi kỹ thuật** của Thầy/Cô.
> 2. **Tuyệt đối không thu thập dữ liệu cá nhân của học sinh:** Không ghi họ tên thật, ngày sinh, số điện thoại, địa chỉ nhà, mã định danh công dân hoặc bảng điểm chi tiết gắn với danh tính thật của học sinh vào phiếu này. Mọi thử nghiệm chỉ dùng tên giả định (ví dụ: *Học sinh A*, *Trần Thử Nghiệm*).
> 3. Toàn bộ ý kiến đóng góp của Thầy/Cô được sử dụng nội bộ để hoàn thiện phần mềm trước khi triển khai chính thức.

---

## PHẦN I: THÔNG TIN CHUNG

- **Họ và tên Thầy/Cô (tùy chọn):** ............................................................................
- **Bộ môn giảng dạy:** [ ] Toán học &emsp; [ ] Ngữ văn &emsp; [ ] Khác: ...........................
- **Khối lớp tham gia thử nghiệm:** [ ] Lớp 6 &emsp; [ ] Lớp 11 &emsp; [ ] Khác: ...................
- **Thiết bị và trình duyệt sử dụng:**
  - Thiết bị: [ ] Máy tính để bàn (PC) &emsp; [ ] Laptop Windows &emsp; [ ] MacBook
  - Trình duyệt: [ ] Google Chrome &emsp; [ ] Microsoft Edge &emsp; [ ] Cốc Cốc &emsp; [ ] Safari
- **Tổng thời gian Thầy/Cô trải nghiệm hệ thống:** ................ phút.

---

## PHẦN II: KHẢO SÁT TRẢI NGHIỆM CHI TIẾT THEO CÁC LUỒNG (F1 – F8)

*Thầy/Cô vui lòng đánh giá theo thang điểm từ **1 (Rất khó / Rất không hài lòng)** đến **5 (Rất dễ / Rất hài lòng)** và ghi chú ngắn gọn cảm nhận thực tế.*

### 1. Luồng F1: Đăng nhập & Đổi mật khẩu khởi tạo lần đầu
- Thao tác đăng nhập và hộp thoại bắt buộc đổi mật khẩu có rõ ràng không?
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- Thời gian Thầy/Cô hoàn thành bước này: Khoảng ............ phút.
- Thầy/Cô có gặp khó khăn hay bối rối ở điểm nào không?
  *Trả lời:* ..........................................................................................................................................

---

### 2. Luồng F2: Soạn đề 7 dạng câu hỏi & Lưu trữ an toàn (CAS)
- Trong 7 định dạng câu hỏi (Trắc nghiệm, Đúng/Sai, Trả lời ngắn, Tự luận kèm barem, Điền khuyết, Ghép nối, Sắp xếp), Thầy/Cô thấy:
  - Dạng câu hỏi dễ nhập liệu nhất: ................................................................................................
  - Dạng câu hỏi cần cải tiến cách nhập liệu nhất: ..............................................................................
- Thao tác chèn hình ảnh (`Figure`) và gán đoạn trích ngữ liệu dùng chung (`Passage`):
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- Công thức toán học (KaTeX): Hiển thị có sắc nét và chuẩn xác không?
  - [ ] Rất tốt, hiển thị chuẩn &emsp; [ ] Bình thường &emsp; [ ] Có công thức bị lỗi hiển thị
- Tính năng lưu đề và bảo vệ chống ghi đè (khi mở 2 tab):
  - [ ] Hoạt động mượt mà &emsp; [ ] Có cảnh báo xung đột dễ hiểu &emsp; [ ] Chưa thử mở 2 tab

---

### 3. Luồng F3: Xem trước bản in A4, Chế độ Song song, Trộn đề & Xuất Word
- **Chế độ xem "Song song" (Đề bên trái, Đáp án & Hướng dẫn bên phải):**
  - Chế độ này có giúp ích cho Thầy/Cô trong việc đối chiếu nhanh đề và đáp án không?
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- **Tính năng Trộn 4 mã đề (`ShuffleModal`):**
  - Ma trận đáp án hoán vị và tải riêng từng mã đề có đáp ứng tốt nhu cầu thi học kỳ không?
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- **Tệp Word (.docx) tải về máy:**
  - Khi mở bằng Word trên máy, font chữ, căn lề và công thức toán học có hiển thị đẹp không?
  - [ ] Đẹp mắt, chỉnh sửa bình thường &emsp; [ ] Bị lệch dòng / vỡ bảng &emsp; [ ] Khác: .................

---

### 4. Luồng F4: Chia sẻ liên kết & Nút "Tạo bản sao để sửa"
- Thao tác tạo liên kết xem trước (`/share/[id]`) gửi cho đồng nghiệp:
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- **Nút "Tạo bản sao để sửa" ở trang chia sẻ:**
  - Đồng nghiệp bấm tạo bản sao vào kho đề riêng có hoạt động nhanh chóng và trơn tru không?
  - [ ] Rất nhanh và tiện lợi &emsp; [ ] Chưa thử nghiệm tính năng này &emsp; [ ] Gặp lỗi khi sao chép
- Tính năng bảo mật đáp án (chỉ sao chép đáp án khi link gốc có bật hiện đáp án):
  - Thầy/Cô có cảm thấy an tâm với cơ chế bảo vệ bí mật đề thi này không?
  - *Ý kiến:* .........................................................................................................................................

---

### 5. Luồng F5: Giao bài thi trực tuyến & Tùy chọn nâng cao
- **Mục "Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài":**
  - Các ô cài đặt: Giờ mở/đóng, Số lượt làm (1-10), Mã vào bài (4-12 ký tự), Trộn câu hỏi, Trộn đáp án có dễ thao tác không?
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- **Dòng thông tin theo dõi tại trang quản lý bài giao (`/teacher/assignments/[id]`):**
  - Dòng hiển thị: `Mở: ... · Đóng: ... · Số lượt: ... · Mã vào bài: ...` và huy hiệu `Đang Mở` / `Đã Đóng` có giúp Thầy/Cô nắm bắt tình trạng đợt thi dễ dàng không?
  - [ ] Rất rõ ràng &emsp; [ ] Bình thường &emsp; [ ] Cần làm nổi bật hơn

---

### 6. Luồng F6: Trải nghiệm học sinh làm bài thi trực tuyến
- Học sinh truy cập liên kết phòng thi `/a/[publicId]` không cần đăng nhập:
  - Thầy/Cô đánh giá độ thuận tiện đối với học sinh: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- **Thử nghiệm sự cố mạng / Bấm F5 tải lại trang:**
  - Khi tải lại trang, bài làm của học sinh có được khôi phục nguyên vẹn 100% không?
  - [ ] Khôi phục hoàn toàn nguyên vẹn &emsp; [ ] Bị mất câu trả lời &emsp; [ ] Chưa thử nghiệm
- Giao diện làm bài và đồng hồ đếm ngược:
  - Học sinh có phản ánh gặp khó khăn khi chọn đáp án hoặc gõ bài tự luận không?
  - *Ý kiến:* .........................................................................................................................................

---

### 7. Luồng F7: Chấm bài tự luận & Xuất bảng điểm Excel (CSV)
- Bảng chấm điểm bài làm tự luận (`TeacherGradeEditor`):
  - Việc đọc bài làm, chấm điểm theo barem và nhập lời nhận xét có thuận tiện không?
  - Điểm đánh giá: `[ 1 ]` &emsp; `[ 2 ]` &emsp; `[ 3 ]` &emsp; `[ 4 ]` &emsp; `[ 5 ]`
- **Tệp xuất Excel (CSV):**
  - Tải về và mở trên Microsoft Excel: Font tiếng Việt có hiển thị chuẩn xác không? Cột điểm trắc nghiệm, tự luận và tổng kết có khớp không?
  - [ ] Mở tiếng Việt chuẩn, số điểm chính xác 100% &emsp; [ ] Bị lỗi font &emsp; [ ] Khác: .................

---

### 8. Đánh giá tổng thể & Đề xuất cải tiến
- Ba tính năng Thầy/Cô hài lòng nhất ở ExamCraft:
  1. ................................................................................................................................................
  2. ................................................................................................................................................
  3. ................................................................................................................................................
- Những điểm Thầy/Cô thấy còn bất tiện hoặc mong muốn bổ sung thêm:
  *Đề xuất:* .........................................................................................................................................
  ......................................................................................................................................................

---

## PHẦN III: BẢNG GHI NHẬN SỰ CỐ KỸ THUẬT & LỖI (BUG LOG)

*Nếu trong quá trình sử dụng Thầy/Cô gặp bất kỳ lỗi hiển thị, nút bấm không phản hồi, thông báo lỗi màu đỏ hoặc tệp tải về bị hỏng, xin vui lòng ghi lại vào bảng dưới đây để đội ngũ kỹ thuật xử lý ngay lập tức:*

| STT | Thời điểm phát hiện | Màn hình / Luồng gặp lỗi | Mức độ nghiêm trọng (*) | Mô tả hiện tượng lỗi | Các bước thao tác dẫn đến lỗi (Tái hiện) | Tên tệp ảnh chụp màn hình đính kèm |
|:---:|:---:|:---:|:---:|---|---|---|
| *Mẫu* | *14:30 24/10* | *Soạn đề (F2)* | *Trung bình* | *Bấm chèn công thức phân số bị lệch dòng trong câu 3* | *1. Chọn câu 3; 2. Gõ $\frac{a}{b}$; 3. Xem trước A4 thấy đè chữ* | `loi_phan_so_cau3.png` |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

*(*) Quy ước mức độ nghiêm trọng:*
- **Nghiêm trọng (Blocker):** Hệ thống bị treo, không lưu được đề, học sinh không thể nộp bài hoặc mất toàn bộ dữ liệu.
- **Cao (High):** Tính năng chính không hoạt động (ví dụ không xuất được file Word, không tạo được bản sao).
- **Trung bình (Medium):** Tính năng hoạt động nhưng giao diện bị lệch, lỗi hiển thị font hoặc thao tác khó chịu.
- **Thấp (Low):** Góp ý nhỏ về câu chữ, màu sắc, vị trí nút bấm.

---

## HƯỚNG DẪN GỬI LẠI PHIẾU
- Sau khi hoàn thành buổi thử nghiệm, Thầy/Cô vui lòng gửi lại tệp phiếu này hoặc chụp ảnh bảng ghi lỗi gửi qua kênh liên lạc nội bộ của Nhà trường hoặc gửi trực tiếp cho Chủ dự án.
- **Trân trọng cảm ơn sự đóng góp quý báu của Quý Thầy/Cô!**
