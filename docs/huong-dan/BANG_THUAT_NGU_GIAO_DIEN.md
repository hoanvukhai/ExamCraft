# SỔ TỪ VỰNG VÀ BẢNG THUẬT NGỮ GIAO DIỆN THỐNG NHẤT
*Đề xuất chuẩn hóa ngôn ngữ giao diện người dùng — Dự án ExamCraft*
*Căn cứ báo cáo kiểm toán UI GEM-R3 và chỉ đạo điều phối nhiệm vụ GEM-S4 (P2, Generation 11)*

> [!IMPORTANT]
> **HƯỚNG DẪN DÀNH CHO CHỦ DỰ ÁN VÀ ĐỘI NGŨ PHÁT TRIỂN:**
> Tài liệu này tổng hợp các thuật ngữ cốt lõi đang bị phân mảnh cách gọi giữa các màn hình, đề xuất một cách gọi duy nhất chuẩn sư phạm. **Chủ dự án xem xét lựa chọn phương án cuối cùng trước khi Kỹ sư Codex tiến hành sửa mã nguồn**, nhằm tránh làm gãy các bộ kiểm thử trình duyệt tự động đang bám theo nhãn cũ.

---

## BẢNG ĐỀ XUẤT THUẬT NGỮ GIAO DIỆN THỐNG NHẤT

### 1. Thuật ngữ: Kho đề thi của giáo viên
- **Cách gọi đề xuất thống nhất:** **Kho đề của tôi**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/Header.tsx` (dòng 144): đang dùng **Kho đề**
  + `src/components/TeacherDashboard.tsx` (tiêu đề trang): đang dùng **Kho Đề Cá Nhân**
  + `src/components/TeacherDashboard.tsx` (thanh bên bộ lọc): đang dùng **Kho đề của tôi**
- **Lý do đề xuất:** Mang tính sở hữu cá nhân rõ ràng (My Library / My Exams), thân thiện, phân biệt rõ với Ngân hàng đề chung của nhà trường.

---

### 2. Thuật ngữ: Tải tệp văn bản Word
- **Cách gọi đề xuất thống nhất:** **Tải file Word (.docx)**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/Header.tsx` (dòng 217): đang dùng **Tải Word (.docx)**
  + `src/components/Header.tsx` (dòng 213, tooltip): đang dùng **Tải file Word (.docx) chuẩn công thức OMML**
  + `src/components/TeacherDashboard.tsx` (dòng 1143): đang dùng **Tải Word**
  + `src/components/A4Preview.tsx` (dòng 74): đang dùng **Tải file Word (.docx)**
  + `src/components/ShareModal.tsx` (dòng 260): đang dùng **Link Xem / Tải Word (.docx)**
- **Lý do đề xuất:** Nêu rõ cả tên quen thuộc (Word) và đuôi định dạng chuẩn (.docx) để giáo viên biết tệp tải về có thể mở trực tiếp và chỉnh sửa trên máy tính.

---

### 3. Thuật ngữ: Tạo bản sao đề thi
- **Cách gọi đề xuất thống nhất:** **Tạo bản sao**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/TeacherDashboard.tsx` (dòng 1150): đang dùng **Nhân bản**
  + `src/app/share/[id]/page.tsx` (dòng 190): đang dùng **Tạo bản sao để sửa**
  + `src/components/ShareModal.tsx`: đang dùng **tạo bản sao**
  + Khi tạo xong, hệ thống tự động gắn hậu tố: **(Bản sao)**
- **Lý do đề xuất:** Từ Nhân bản mang sắc thái sinh học hoặc kỹ thuật máy móc; từ Tạo bản sao thuần Việt, chuẩn sư phạm văn phòng, đồng bộ với Google Docs / Drive (Make a copy).

---

### 4. Thuật ngữ: Phát đề cho học sinh làm trực tuyến
- **Cách gọi đề xuất thống nhất:** **Giao bài thi**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/ShareModal.tsx` (dòng 251): đang dùng **Giao Bài Thi Online (Cho Học Sinh Làm Trực Tuyến)**
  + `src/components/ExamWorkspace.tsx`: đang dùng **Giao bài thi**
  + `src/components/TeacherDashboard.tsx`: đang dùng **Giao bài**
  + `src/app/teacher/assignments/page.tsx`: đang dùng **Bài đã giao**
- **Lý do đề xuất:** Giao bài thi ngắn gọn, trang trọng, vừa vặn trên các nút bấm điện thoại; tránh dùng từ chêm tiếng Anh (Online).

---

### 5. Thuật ngữ: Số lần học sinh được phép làm bài
- **Cách gọi đề xuất thống nhất:** **Số lượt làm bài**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/ShareModal.tsx` (dòng 527): đang dùng **Số lượt làm tối đa**
  + `src/app/teacher/assignments/[id]/page.tsx`: đang dùng **Lượt làm**
  + `src/app/a/[publicId]/page.tsx`: đang dùng **Lượt 1**, **Lượt 2**
- **Lý do đề xuất:** Diễn đạt đầy đủ nghĩa trong màn hình cấu hình phòng thi (Số lượt làm bài: 1 lượt / Không giới hạn); trong bảng điểm thì rút gọn thành Lượt 1, Lượt 2.

---

### 6. Thuật ngữ: Bản nháp lưu trữ tạm trên máy tính
- **Cách gọi đề xuất thống nhất:** **Bản nháp tự lưu trên máy**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/app/editor/new/page.tsx`: đang dùng **Bản nháp chưa lưu trên máy này**
  + `src/components/ExamWorkspace.tsx`: đang dùng trạng thái **Đang lưu nháp...** và **Đã lưu nháp**
  + `src/app/a/[publicId]/page.tsx`: đang dùng **Bản nháp tự động lưu trên máy**
- **Lý do đề xuất:** Giúp người dùng hiểu cơ chế an toàn: dữ liệu đang được trình duyệt tự động bảo vệ tại bộ nhớ máy, không bị mất nếu đột ngột mất mạng.

---

### 7. Thuật ngữ: Đính chính đáp án sau khi đã thi
- **Cách gọi đề xuất thống nhất:** **Sửa đáp án và chấm lại**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/app/teacher/assignments/[id]/page.tsx` (thẻ tab): đang dùng **Sửa đáp án & chấm lại**
  + `src/components/RegradePanel.tsx` (dòng 77, nút bấm): đang dùng **Sửa đáp án và chấm lại**
  + `src/components/RegradePanel.tsx` (dòng 76, nút xem trước): đang dùng **Xem trước ảnh hưởng**
- **Lý do đề xuất:** Sử dụng chữ và thay cho ký tự và (&) để bảo đảm tính chuẩn mực văn bản tiếng Việt; nêu bật được hai bước: sửa đáp án rồi hệ thống tự động chấm lại điểm.

---

### 8. Thuật ngữ: Chia sẻ liên kết cho đồng nghiệp
- **Cách gọi đề xuất thống nhất:** **Chia sẻ đề thi**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/Header.tsx` (dòng 195): đang dùng nút **Chia sẻ**
  + `src/components/ShareModal.tsx` (tiêu đề): đang dùng **Chia sẻ đề thi**
  + `src/components/ExamCollaboratorsPanel.tsx`: đang dùng **Cộng tác viên**
- **Lý do đề xuất:** Phân biệt rõ giữa Chia sẻ đề thi (gửi link xem, cấp quyền sửa) và Giao bài thi (cấp mã làm bài cho học sinh).

---

### 9. Thuật ngữ: Xem trước và in khổ giấy A4
- **Cách gọi đề xuất thống nhất:** **In đề thi (A4)**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/Header.tsx` (dòng 226): đang dùng nút **In A4**
  + `src/components/A4Preview.tsx` (dòng 109): đang dùng chế độ **Đề in ấn**
  + `src/components/A4Preview.tsx` (dòng 121): đang dùng chế độ **Song song**
- **Lý do đề xuất:** Rõ ràng hành động (In đề thi) và tiêu chuẩn kích thước giấy in ấn của học đường Việt Nam (A4).

---

### 10. Thuật ngữ: Nút hành động đăng nhập tài khoản
- **Cách gọi đề xuất thống nhất:** **Đăng nhập**
- **Vị trí hiện tại:**
  + `src/components/Header.tsx` (dòng 392): đang dùng **Đăng nhập**
  + `src/app/login/page.tsx` (dòng 50, nút submit form): đang dùng **Đăng nhập hệ thống**
- **LƯU Ý KỸ THUẬT QUAN TRỌNG:**
  + Hiện tại bộ kiểm thử trình duyệt tự động của dự án đang tìm kiếm chính xác chuỗi Đăng nhập hệ thống trên trang đăng nhập.
  + **Khuyến nghị:** Tạm thời giữ nguyên Đăng nhập hệ thống tại trang login cho đến khi Kỹ sư Codex cập nhật kịch bản kiểm thử tương ứng.

---

### 11. Thuật ngữ: Bảng vinh danh điểm số của lớp
- **Cách gọi đề xuất thống nhất:** **Bảng xếp hạng lớp**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/app/a/[publicId]/page.tsx` (dòng 1367): đang dùng **Bảng xếp hạng lớp**
  + `src/components/ShareModal.tsx` (tùy chọn): đang dùng **Bảng xếp hạng Top & Me**
  + `src/app/teacher/assignments/[id]/page.tsx`: đang dùng **Bảng xếp hạng**
- **Lý do đề xuất:** Cụm từ Bảng xếp hạng lớp mang tính giáo dục, khích lệ tinh thần học tập tập thể, tránh dùng tiếng Anh Top and Me gây khó hiểu cho học sinh lớp 6.

---

### 12. Thuật ngữ: Tiêu chí và hướng dẫn chấm câu tự luận
- **Cách gọi đề xuất thống nhất:** **Barem chấm điểm**
- **Các vị trí đang dùng cách gọi khác nhau:**
  + `src/components/A4Preview.tsx` (dòng 133): đang dùng **Barem**
  + `src/components/QuestionCard.tsx` (dòng 598): đang dùng **Tiêu chí chấm (Rubric)**
  + `src/components/QuestionCard.tsx` (dòng 622): đang dùng cột **Điểm tối đa**
- **Lý do đề xuất:** Thuật ngữ Barem chấm điểm đã ăn sâu vào tiềm thức và thói quen chuyên môn của 100% giáo viên phổ thông Việt Nam, quen thuộc hơn thuật ngữ chuyên ngành Rubric.

---
*Bảng đối chiếu thuật ngữ giao diện ExamCraft 2026 phục vụ rà soát trước khi hiệu chỉnh mã nguồn.*
